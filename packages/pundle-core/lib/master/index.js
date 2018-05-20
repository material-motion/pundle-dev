// @flow

import os from 'os'
import pMap from 'p-map'
import pReduce from 'p-reduce'
import flatten from 'lodash/flatten'
import promiseDefer from 'promise.defer'
import {
  Job,
  PundleError,
  getChunk,
  getFileImportHash,
  type Chunk,
  type ImportResolved,
  type ImportRequest,
  type ComponentFileResolverResult,
  type WorkerProcessResult,
} from 'pundle-api'
import type { Config } from 'pundle-core-load-config'

import { getOutputPath } from './helpers'
import WorkerDelegate from '../worker/delegate'
import type { RunOptions } from '../types'

// TODO: Locks for files and chunks
export default class Master {
  config: Config
  options: RunOptions
  resolverWorker: WorkerDelegate
  processorWorkers: Array<WorkerDelegate>
  queue: Array<{| payload: {}, resolve: Function, reject: Function |}>

  constructor(config: Config, options: RunOptions) {
    this.config = config
    this.options = options
    this.queue = []

    this.resolverWorker = new WorkerDelegate('resolver', options, this)
    this.processorWorkers = os.cpus().map(() => new WorkerDelegate('processor', options, this))
  }
  getAllWorkers(): Array<WorkerDelegate> {
    return [this.resolverWorker].concat(this.processorWorkers)
  }
  async spawnWorkers() {
    try {
      await Promise.all(
        this.getAllWorkers().map(async worker => {
          if (worker.isAlive()) return
          try {
            await worker.spawn()
          } catch (error) {
            worker.dispose()
            throw error
          }
        }),
      )
    } catch (error) {
      throw new PundleError('DAEMON', 'WORKER_CRASHED', null, null, `Worker crashed during initial spawn: ${error.message}`)
    }
  }
  dispose() {
    this.getAllWorkers().forEach(function(worker) {
      worker.dispose()
    })
  }
  report(issue: $FlowFixMe) {
    console.log('issue reported to master', issue)
  }

  async execute(): Promise<void> {
    const job = new Job()
    const entries = await Promise.all(
      this.config.entry.map(entry =>
        this.resolve({
          request: entry,
          requestRoot: this.config.rootDirectory,
          ignoredResolvers: [],
        }),
      ),
    )
    await pMap(entries, entry => this.processChunk(getChunk(entry.format, null, entry.resolved), job))
    const generated = await this.generate(job)

    // TODO: Maybe do something else?
    return generated
  }
  async generate(
    givenJob: Job,
  ): Promise<Array<{ id: string, filePath: string | false, format: string, contents: string | Buffer }>> {
    let job = givenJob.clone()
    const jobTransformers = this.config.components.filter(c => c.type === 'job-transformer')

    job = await pReduce(
      jobTransformers,
      async (value, component) => {
        const result = await component.callback(value)
        // TODO: Validation
        return result || value
      },
      job,
    )

    const chunkGenerators = this.config.components.filter(c => c.type === 'chunk-generator')
    if (!chunkGenerators.length) {
      throw new Error('No chunk-generator components configured')
    }

    const generated = await pMap(job.chunks.values(), async chunk => {
      for (let i = 0, { length } = chunkGenerators; i < length; i++) {
        const generator = chunkGenerators[i]
        const result = await generator.callback(chunk, job, {
          getOutputPath: (output: { id: string, entry: ?string, format: string }) => getOutputPath(this.config, output),
        })
        if (result) {
          return result.map(item => ({ ...item, id: chunk.id, filePath: getOutputPath(this.config, chunk) }))
        }
      }
      throw new Error(
        `All generators refused to generate chunk of format '${chunk.format}' with label '${chunk.label}' and entry '${
          chunk.entry
        }'`,
      )
    })

    return flatten(generated)
  }
  async processChunk(chunk: Chunk, job: Job): Promise<void> {
    const { entry } = chunk
    if (!entry) {
      // TODO: Return silently instead?
      throw new Error('Cannot process chunk without entry')
    }
    if (job.locks.has(chunk.id)) return
    if (job.chunks.has(chunk.id)) return

    job.locks.add(chunk.id)
    try {
      job.chunks.set(chunk.id, chunk)

      await this.processFileTree(
        {
          format: chunk.format,
          filePath: entry,
        },
        false,
        job,
      )
    } catch (error) {
      job.chunks.delete(chunk.id)
      throw error
    } finally {
      job.locks.delete(chunk.id)
    }
  }
  // TODO: Use cached old files here if present on the job?
  async processFileTree(request: ImportResolved, forcedOverwrite: boolean, job: Job): Promise<void> {
    const lockKey = getFileImportHash(request.filePath, request.format)
    const oldFile = job.files.get(lockKey)
    if (job.locks.has(lockKey)) {
      return
    }
    if (oldFile && !forcedOverwrite) {
      return
    }
    job.locks.add(lockKey)

    try {
      const newFile = await this.queuedProcess(request)
      job.files.set(newFile.id, newFile)
      await Promise.all([
        pMap(newFile.imports, fileImport => this.processFileTree(fileImport, false, job)),
        pMap(newFile.chunks, fileChunk => this.processChunk(fileChunk, job)),
      ])
    } catch (error) {
      if (oldFile) {
        job.files.set(lockKey, oldFile)
      } else {
        job.files.delete(lockKey)
      }
      throw error
    } finally {
      job.locks.delete(lockKey)
    }
  }
  async resolve(request: ImportRequest): Promise<ComponentFileResolverResult> {
    return this.resolverWorker.send('resolve', request)
  }
  async queuedProcess(payload: ImportResolved): Promise<WorkerProcessResult> {
    const currentWorker = this.processorWorkers.find(worker => worker.isWorking === 0)
    if (currentWorker) {
      return currentWorker.send('process', payload, () => {
        const itemToProcess = this.queue.pop()
        if (itemToProcess) {
          currentWorker.send('process', itemToProcess.payload).then(itemToProcess.resolve, itemToProcess.reject)
        }
      })
    }
    const deferred = promiseDefer()
    this.queue.push({
      payload,
      resolve: deferred.resolve,
      reject: deferred.reject,
    })
    return deferred.promise
  }
}

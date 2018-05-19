// @flow

import * as t from '@babel/types'
import { parse } from 'babylon'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import { createFileTransformer, getChunk, getFileImportHash } from 'pundle-api'

import manifest from '../package.json'
import { getName } from './helpers'

const INJECTIONS = new Map([['timers', ['setImmediate', 'clearImmediate']], ['buffer', ['Buffer']], ['process', 'process']])
const INJECTIONS_NAMES = new Map()
INJECTIONS.forEach(function(names, sourceModule) {
  ;[].concat(names).forEach(function(name) {
    INJECTIONS_NAMES.set(name, sourceModule)
  })
})

// TODO: have a config?
export default function({ transformCore }: { transformCore: boolean }) {
  return createFileTransformer({
    name: 'pundle-transformer-commonjs',
    version: manifest.version,
    async callback({ filePath, format, contents, isBuffer }, { resolve, addImport, addChunk }) {
      // Only ever process JS files
      if (format !== 'js') return null

      const ast = parse(isBuffer ? contents.toString() : contents, {
        plugins: ['dynamicImport'],
        sourceType: 'module',
        sourceFilename: filePath,
      })
      const promises = []
      const injectionNames = new Set()
      traverse(ast, {
        ImportDeclaration({ node }) {
          const { source } = node
          if (!t.isStringLiteral(source)) return
          promises.push(
            resolve(source.value, source.loc).then(resolved => {
              source.value = getFileImportHash(resolved.filePath, resolved.format)
              addImport(resolved)
            }),
          )
        },
        CallExpression(path) {
          const { node } = path
          const { callee } = node
          const [arg] = node.arguments

          if (!t.isStringLiteral(arg)) return

          if (t.isImport(callee)) {
            promises.push(
              resolve(arg.value, arg.loc).then(resolved => {
                const chunk = getChunk(resolved.format, null, resolved.filePath)
                node.callee = t.memberExpression(t.identifier('require'), t.identifier('chunk'))
                arg.value = chunk.id
                addChunk(chunk)
              }),
            )
            return
          }

          if (!['require', 'require.resolve'].includes(getName(callee)) || path.scope.hasBinding('require')) {
            return
          }

          // Handling require + require.resolve
          promises.push(
            resolve(arg.value, arg.loc).then(resolved => {
              arg.value = getFileImportHash(resolved.filePath, resolved.format)
              addImport(resolved)
            }),
          )
        },
        ...(transformCore
          ? {
              Identifier(path) {
                const { node } = path
                if (
                  INJECTIONS_NAMES.has(node.name) &&
                  !injectionNames.has(node.name) &&
                  path.isReferencedIdentifier() &&
                  !path.scope.hasBinding(node.name)
                ) {
                  injectionNames.add(node.name)
                }
              },
            }
          : {}),
      })

      const injectionImports = new Map()
      injectionNames.forEach(item => {
        const sourceModule = INJECTIONS_NAMES.get(item)
        promises.push(
          resolve(sourceModule).then(resolved => {
            injectionImports.set(sourceModule, getFileImportHash(resolved.filePath, resolved.format))
            addImport(resolved)
          }),
        )
      })

      await Promise.all(promises)
      if (injectionImports.size) {
        const wrapper = t.callExpression(t.functionExpression(null, [], t.blockStatement([])), [])
        injectionImports.forEach((resolved, importName) => {
          wrapper.arguments.push(t.callExpression(t.identifier('require'), [t.stringLiteral(resolved)]))
          let names = INJECTIONS.get(importName)
          if (typeof names === 'string') {
            wrapper.callee.params.push(t.identifier(names))
          } else {
            names = names.filter(item => injectionNames.has(item))
            const refName = `__$sb$pundle${importName}`
            wrapper.callee.params.push(t.identifier(refName))
            ast.program.body = [
              t.variableDeclaration(
                'var',
                names.map(name =>
                  t.variableDeclarator(t.identifier(name), t.memberExpression(t.identifier(refName), t.identifier(name))),
                ),
              ),
            ].concat(ast.program.body)
          }
        })
        wrapper.callee.body.body = ast.program.body
        wrapper.callee.body.directives = ast.program.directives
        ast.program.body = [t.expressionStatement(wrapper)]
        ast.program.directives = []
      }

      const generated = generate(ast, {
        sourceMaps: true,
      })

      return {
        contents: generated.code,
        isBuffer: false,
        sourceMap: generated.map,
      }
    },
  })
}

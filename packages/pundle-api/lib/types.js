// @flow

export type ErrorType = 'CONFIG' | 'DAEMON'
export type ErrorCode = 'FILE_NOT_FOUND' | 'CONFIG_NOT_FOUND' | 'INVALID_CONFIG' | 'WORKER_CRASHED'

export type Chunk = {
  format: string,
  label: ?string,
  entry: ?string,
  imports: Array<string>,
}
export type FileImportRequest = {
  format: ?string,
  filePath: string,
}

export type FileImport = {
  format: string,
  filePath: string,
}

export type ComponentType = 'issue-reporter' | 'file-resolver' | 'file-loader' | 'file-transformer'
export type ComponentCallback<T1, T2> = (...T1) => Promise<?T2> | ?T2
export type Component<T1: ComponentType, T2> = {|
  name: string,
  version: string,
  priority: number,
  type: T1,
  callback: T2,

  // automatically added
  apiVersion: number,
|}

export type ComponentIssueReporterCallback = ComponentCallback<[any], void>
export type ComponentIssueReporter = Component<'issue-reporter', ComponentIssueReporterCallback>

export type ResolveRequest = {|
  request: string,
  requestRoot: string,
  format?: string,
  resolved: ?string,
  resolvedRoot: ?string,
|}
export type ResolveResult = {|
  request: string,
  requestRoot: string,
  format: string,
  resolved: string,
  resolvedRoot: ?string,
|}
export type ComponentFileResolverCallback = ComponentCallback<[ResolveRequest], ResolveResult>
export type ComponentFileResolver = Component<'file-resolver', ComponentFileResolverCallback>

export type LoaderRequest = {|
  format: string,
  contents: Buffer,
  filePath: string,
|}

export type LoaderResult = {|
  contents: Buffer | string,
  isBuffer: boolean,
  sourceMap: ?Object,
|}

export type ComponentFileLoaderCallback = ComponentCallback<[LoaderRequest], LoaderResult>
export type ComponentFileLoader = Component<'file-loader', ComponentFileLoaderCallback>

export type ComponentFileTransformerCallback = ComponentCallback<[LoaderResult], LoaderResult>
export type ComponentFileTransformer = Component<'file-transformer', ComponentFileTransformerCallback>

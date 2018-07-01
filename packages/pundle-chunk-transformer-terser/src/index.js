// @flow

import { minify } from 'terser'
import { createChunkTransformer } from 'pundle-api'

import manifest from '../package.json'

// TODO: Fix source maps
function createComponent({ options = {} }: { options?: Object } = {}) {
  return createChunkTransformer({
    name: 'pundle-chunk-transformer-js-terser',
    version: manifest.version,
    async callback({ format, contents }) {
      if (format !== 'js') return null

      const { code, error } = minify(typeof contents === 'string' ? contents : contents.toString(), {
        compress: {
          keep_fargs: false,
          ...(options && options.compress ? options.compress : {}),
        },
        ...options,
      })
      if (error) {
        throw new Error(error)
      }

      return {
        contents: code,
        sourceMap: null,
      }
    },
  })
}

module.exports = createComponent

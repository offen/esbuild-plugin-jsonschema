/**
 * Copyright 2021 - Frederik Ring <frederik.ring@gmail.com>
 * SPDX-License-Identifier: MIT
 */

const Ajv = require('ajv')
const pack = require('ajv-pack')
const fs = require('fs')

const ajv = new Ajv({ sourceCode: true })
const isSchemaSecure = ajv.compile(require('ajv/lib/refs/json-schema-secure.json'))

module.exports = (options = {}) => ({
  name: 'jsonschema',
  setup (build) {
    const secure = (options && 'secure' in options) ? options.secure : true
    const filter = (options && 'filter' in options) ? options.filter : /\.schema$/

    build.onLoad({ filter }, async (args) => {
      const contents = await fs.promises.readFile(args.path, 'utf8')
      let moduleCode
      try {
        const schema = JSON.parse(contents)
        if (secure && !isSchemaSecure(schema)) {
          return {
            errors: isSchemaSecure.errors.map(err => {
              return { text: `Schema ${args.path} is not secure`, detail: err }
            })
          }
        }
        moduleCode = pack(ajv, ajv.compile(schema))
      } catch (err) {
        return {
          errors: [{ text: 'Error compiling and packing schema', detail: err }]
        }
      }

      return { contents: moduleCode }
    })
  }
})

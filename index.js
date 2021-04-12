/**
 * Copyright 2021 - Frederik Ring <frederik.ring@gmail.com>
 * SPDX-License-Identifier: MIT
 */

const Ajv = require('ajv')
const standaloneCode = require('ajv/dist/standalone').default
const fs = require('fs')
const addAjvFormats = require('ajv-formats')

const ajvSecure = new Ajv({ strictTypes: false })
const isSchemaSecure = ajvSecure.compile(require('ajv/lib/refs/json-schema-secure.json'))

module.exports = ({
  filter = /\.schema$|\.schema\.json$/,
  secure = true,
  addFormats = true,
  ajvOptions = {}
} = {}) => {
  const ajv = new Ajv({ code: { source: true }, ...ajvOptions })
  if (addFormats) addAjvFormats(ajv)
  return {
    name: 'jsonschema',
    setup (build) {
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
          moduleCode = standaloneCode(ajv, ajv.compile(schema))
        } catch (err) {
          return {
            errors: [{ text: 'Error compiling and packing schema', detail: err }]
          }
        }

        return { contents: moduleCode }
      })
    }
  }
}

# esbuild-plugin-jsonschema
Compile and pack JSON schema definitions on import using esbuild

## Installation

The package is released to npm as `@offen/esbuild-plugin-jsonschema`:

```
npm install @offen/esbuild-plugin-jsonschema -D
```

## Usage

In the default configuration, the transform is applied to all files with a `.schema` extension. The transformed module will export the packed AJV `validate` function.

In your application:

```js
const validateFoo = require('./foo.schema')

const ok = validateFoo({ foo: true })
if (!ok) {
  console.log(validateFoo.errors)
  throw new Error('Foo did not validate')
}
```

When bundling:

```js
const esbuild = require('esbuild')
const jsonschemaPlugin = require('@offen/esbuild-plugin-jsonschema')

esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  plugins: [jsonschemaPlugin()],
  outdir: './public'
})
```

### Defining schemas

Schemas are expected to be defined in JSON format and saved as `.schema` files:

```json
{
  "type": "string",
  "maxLength": 128
}
```

## Options

The transform accepts the following options as its 2nd arguments:

### `secure`

By default, this plugin only compiles ["secure" schemas][secure]. This can be disabled by passing `secure: false` to the transform.

[secure]: https://github.com/ajv-validator/ajv/tree/521c3a53f15f5502fb4a734194932535d311267c#security-considerations

### `filter`

By default, only files with a `.schema` extension are compiled. If you have different requirements you can pass a Regexp to `filter` for the plugin to use.

### `addFormats`

Includes [ajv-formats](https://github.com/ajv-validator/ajv-formats). Default `true`.

### `ajvOptions`

Custom [options](https://ajv.js.org/options.html) to be passed to Ajv constructor.

## Releasing a new version

New versions can be released using `npm version <patch|minor|major>`. Make sure you are authenticated against the `@offen` scope with npm.

## License

Copyright 2021 Frederik Ring - Available under the MIT License

const Module = require('module')
const path = require('path')
const tape = require('tape')
const vm = require('vm')
const esbuild = require('esbuild')

const jsonschemaPlugin = require('..')

tape.test('passes schema', function (t) {
  bundle('ok.js', {}, function (err, src) {
    if (err) {
      t.fail(err)
    }

    vm.runInNewContext(src, {
      console: { log: log }
    })

    function log (value) {
      t.equal(value, true, 'passes')
      t.end()
    }
  })
})

tape.test('does not pass schema', function (t) {
  bundle('fail.js', {}, function (err, src) {
    if (err) {
      t.fail(err)
    }

    vm.runInNewContext(src, {
      console: { log: log }
    })

    function log (value) {
      t.equal(value, false, 'fails')
      t.end()
    }
  })
})

tape.test('using custom matcher', function (t) {
  bundle('custom.js', { filter: /\.custom$/ }, function (err, src) {
    if (err) {
      t.fail(err)
    }

    vm.runInNewContext(src, {
      console: { log: log }
    })

    function log (value) {
      t.equal(value, true, 'passes')
      t.end()
    }
  })
})

tape.test('using .schema.json extension', function (t) {
  bundle('ext.js', {}, function (err, src) {
    if (err) {
      t.fail(err)
    }

    vm.runInNewContext(src, {
      console: { log: log }
    })

    function log (value) {
      t.equal(value, true, 'passes')
      t.end()
    }
  })
})

tape.test('secure schema by default', function (t) {
  bundle('insecure.schema', {}, function (err, src) {
    t.ok(err, 'does not compile insecure schema')
    t.match(err[0].text, /is not secure/, 'has correct error message')
    t.end()
  })
})

tape.test('secure schema disabled via option', function (t) {
  bundle('insecure.schema', { secure: false }, function (err, src) {
    t.notOk(err, 'does compile insecure schema when option is passed')
    t.end()
  })
})

tape.test('invalid schema', function (t) {
  bundle('invalid.schema', {}, function (err, src) {
    t.ok(err, 'does not compile invalid schema')
    t.match(err[0].text, /Error compiling and packing/, 'has correct error message')
    t.end()
  })
})

tape.test('addFormats by default', function (t) {
  bundle('insecure.schema', { secure: false }, function (err, src) {
    t.notOk(err, 'does compile schema with date-time format when no addFormats is passed')
    t.end()
  })
})

tape.test('addFormats disabled via option', function (t) {
  bundle('insecure.schema', { secure: false, addFormats: false }, function (err, src) {
    t.ok(err, 'does not compile schema with formats')
    t.end()
  })
})

tape.test('use custom ajvOptions', function (t) {
  bundle(
    'avjoption.schema',
    {
      secure: false,
      ajvOptions: {
        formats: { xix: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i }
      }
    },
    function (err, src) {
      t.notOk(err, 'does compile schema with custom ajvOptions')
      const validate = requireFromString(src)
      validate('http://github.com')
      t.notOk(validate.errors, 'does validate schema with custom format with a valid value')
      validate('xxxxx')
      t.ok(validate.errors, 'does validate schema with custom format with a not valid value')
      t.match(validate.errors[0].message, /must match format "xix"/, 'has correct error message')
      t.end()
    }
  )
})

function bundle (file, opts, callback) {
  esbuild.build({
    entryPoints: [path.join(__dirname, file)],
    bundle: true,
    format: 'cjs',
    plugins: [jsonschemaPlugin(opts)],
    write: false
  })
    .then(function (result) {
      callback(null, result.outputFiles[0].text)
    }, function (errResult) {
      callback(errResult.errors)
    })
}

function requireFromString (str) {
  const m = new Module('', module.parent)
  m._compile(str, '')
  return m.exports
}

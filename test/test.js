const path = require('path')
const tape = require('tape')
const vm = require('vm')
const esbuild = require('esbuild')

const jsonschemaPlugin = require('..')

tape.test('passes schema', function (t) {
  bundle('ok.js', undefined, function (err, src) {
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
  bundle('fail.js', undefined, function (err, src) {
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

tape.test('secure schema by default', function (t) {
  bundle('insecure.schema', { formats: true }, function (err, src) {
    t.ok(err, 'does not compile insecure schema')
    t.match(err[0].text, /is not secure/, 'has correct error message')
    t.end()
  })
})

tape.test('secure schema disabled via option', function (t) {
  bundle('insecure.schema', { secure: false, formats: true }, function (err, src) {
    t.notOk(err, 'does compile insecure schema when option is passed')
    t.end()
  })
})

tape.test('invalid schema', function (t) {
  bundle('invalid.schema', undefined, function (err, src) {
    t.ok(err, 'does not compile invalid schema')
    t.match(err[0].text, /Error compiling and packing/, 'has correct error message')
    t.end()
  })
})

function bundle (file, opts, callback) {
  esbuild.build({
      entryPoints: [path.join(__dirname, file)],
      bundle: true,
      plugins: [jsonschemaPlugin(opts)],
      write: false
    })
    .then(function (result) {
        callback(null, result.outputFiles[0].text)
      }, function (errResult) {
        callback(errResult.errors)
      })
}

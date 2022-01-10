process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('Create Target', function (t) {
  var url = '/api/targets'
  const req = servertest(server(), url, { method: 'POST', encoding: 'json', headers: { 'content-type': 'application/json' } }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.msg, 'added successfully', 'success message')
    t.end()
  })
  req.write(JSON.stringify({
    url: 'http://example2.com',
    value: '0.70',
    maxAcceptsPerDay: '1',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['18', '19']
    }
  }))
  req.end()
})

test.serial.cb('List Targets', function (t) {
  var url = '/api/targets'
  const req = servertest(server(), url, { method: 'GET', encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.truthy(res.data, 'have data')
    t.truthy(res.data[0], 'have data[0]')
    t.truthy(res.data[0].id, 'have data[0].id')
    t.end()
  })
  req.end()
})

process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')
const redis = require('../lib/redis')
const { toRedisPromise } = require('../lib/util')

const mockTargets = [
  {
    url: 'http://example2.com',
    value: '0.70',
    maxAcceptsPerDay: '1',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['18', '19']
    }
  },
  {
    url: 'http://example3.com',
    value: '0.20',
    maxAcceptsPerDay: '10',
    accept: {
      geoState: ['ca', 'ny'],
      hour: ['18', '19', '20']
    }
  }
]

function servertestPromise (server, url, options, payload) {
  return new Promise((resolve, reject) => {
    const defaultOptions = { encoding: 'json', headers: { 'content-type': 'application/json', ...(((options || {}).headers) || {}) }, ...(options || {}) }
    const req = servertest(server, url, defaultOptions, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
    if (payload) {
      req.write(payload)
    }
    if (options) {
      req.end()
    }
  })
}

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial('Create Target', async (t) => {
  await toRedisPromise(redis.FLUSHDB)()
  const url = '/api/targets'
  const targetPayload = mockTargets[0]
  const currentTargetSeq = await toRedisPromise(redis.GET)('targets:seq_count') || 0
  try {
    const res = await servertestPromise(server(), url, { method: 'POST' }, JSON.stringify(targetPayload))
    const latestTargetSeq = await toRedisPromise(redis.GET)('targets:seq_count') || 0

    // test response
    t.is(res.statusCode, 201, 'correct statusCode')
    t.is(res.body.msg, 'added successfully', 'success message')

    // seq count must be increment
    t.is(latestTargetSeq, currentTargetSeq + 1, 'Correct Target Seq Increment')

    // check target object
    const target = await toRedisPromise(redis.HGETALL)(`targets:${latestTargetSeq}`)
    t.is(Number(target.id), latestTargetSeq)
    t.is(target.url, targetPayload.url)
    t.is(target.value, targetPayload.value)
    t.is(target.maxAcceptsPerDay, targetPayload.maxAcceptsPerDay)
    t.is(target.accept, JSON.stringify(targetPayload.accept))
  } catch (error) {
    t.fail('Error in Calling the API: ' + error)
  }
})

test.serial('List Targets', async (t) => {
  const url = '/api/targets'
  try {
    const res = await servertestPromise(server(), url)
    t.is(res.statusCode, 200, 'correct statusCode')
    t.truthy(res.body.data, 'have data')
    t.truthy(res.body.data[0], 'have data[0]')
    t.truthy(res.body.data[0].id, 'have data[0].id')
    t.is(res.body.data[0].url, mockTargets[0].url)
    t.is(res.body.data[0].value, mockTargets[0].value)
    t.is(res.body.data[0].maxAcceptsPerDay, mockTargets[0].maxAcceptsPerDay)
    t.deepEqual(res.body.data[0].accept, mockTargets[0].accept)
  } catch (error) {
    t.fail('Error in Calling the API: ' + error)
  }
})

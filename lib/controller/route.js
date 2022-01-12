const respHandler = require('../helper/resp-handler')
const redis = require('../redis')
const { convertDateToIsoDateWithoutTime, toRedisPromise } = require('../util')

module.exports = {
  getNextRoute
}

async function getNextRoute (req, res, options) {
  try {
    const body = options.body
    const hour = new Date(body.timestamp).getUTCHours()
    const geoState = body.geoState
    const targetIds = await toRedisPromise(redis.ZREVRANGE)(`route:geoState:${geoState}:hour:${hour}`, 0, 1)
    if (!targetIds || !targetIds.length) {
      return respHandler.sendResponse(req, res, { decision: 'reject' })
    }
    const targetId = targetIds[0]
    const [targetCounts, [targetAcceptPerDay, url]] = await Promise.all([
      toRedisPromise(redis.INCR)(`targets:${targetId}:date:${convertDateToIsoDateWithoutTime()}:counts`),
      toRedisPromise(redis.HMGET)(`targets:${targetId}`, ['maxAcceptsPerDay', 'url'])
    ])
    if (targetCounts >= Number(targetAcceptPerDay)) {
      const sortedSets = await toRedisPromise(redis.SMEMBERS)(`targets:${targetId}:sortedSets`)

      await Promise.all([
        ...sortedSets.map((sortedSet) => toRedisPromise(redis.ZREM)(sortedSet, targetId)),
        toRedisPromise(redis.DEL)(`targets:${targetId}:sortedSets`)
      ])
    }
    return respHandler.sendResponse(req, res, { url })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

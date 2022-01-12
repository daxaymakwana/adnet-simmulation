const respHandler = require('../helper/resp-handler')
const redis = require('../redis')
const { convertDateToIsoDateWithoutTime, toRedisPromise } = require('../util')
const redisNamespace = require('../helper/redis-namespaces')

module.exports = {
  getNextRoute
}

async function getNextRoute (req, res, options) {
  try {
    const body = options.body
    const hour = new Date(body.timestamp).getUTCHours()
    const geoState = body.geoState
    const sortedSet = redisNamespace.route.stateAndHourSortedSets(geoState, hour)
    const targetIds = await toRedisPromise(redis.ZREVRANGE)(sortedSet, 0, 1)
    if (!targetIds || !targetIds.length) return respHandler.sendResponse(req, res, { decision: 'reject' })

    const targetId = targetIds[0]
    const [targetCounts, [targetAcceptPerDay, url]] = await Promise.all([
      toRedisPromise(redis.INCR)(redisNamespace.targets.byDateCount(targetId, convertDateToIsoDateWithoutTime())),
      toRedisPromise(redis.HMGET)(redisNamespace.targets.id(targetId), ['maxAcceptsPerDay', 'url'])
    ])
    if (targetCounts >= Number(targetAcceptPerDay)) {
      const sortedSets = await toRedisPromise(redis.SMEMBERS)(redisNamespace.targets.sortedSets(targetId))

      await Promise.all([
        ...sortedSets.map((sortedSet) => toRedisPromise(redis.ZREM)(sortedSet, targetId)),
        toRedisPromise(redis.DEL)(redisNamespace.targets.sortedSets(targetId))
      ])
    }
    return respHandler.sendResponse(req, res, { url })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

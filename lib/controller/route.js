const respHandler = require('../helper/resp-handler')
const redis = require('../redis')
const { convertDateToIsoDateWithoutTime } = require('../util')

async function getNextRoute (req, res, options) {
  try {
    const body = options.body
    const hour = new Date(body.timestamp).getUTCHours()
    const geoState = body.geoState
    const targetIds = await redis.ZRANGE(`route:geoState:${geoState}:hour:${hour}`, 0, 1, { REV: true })
    if (!targetIds || !targetIds.length) {
      return respHandler.sendResponse(req, res, { decision: 'reject' })
    }
    const targetId = targetIds[0]
    const [targetCounts, [targetAcceptPerDay, url]] = await Promise.all([
      redis.INCR(`targets:${targetId}:date:${convertDateToIsoDateWithoutTime()}:counts`),
      redis.HMGET(`targets:${targetId}`, ['maxAcceptsPerDay', 'url'])
    ])
    if (targetCounts >= Number(targetAcceptPerDay)) {
      const sortedSets = await redis.SMEMBERS(`targets:${targetId}:sortedSets`)

      await Promise.all([
        ...sortedSets.map((sortedSet) => redis.ZREM(sortedSet, targetId)),
        redis.DEL(`targets:${targetId}:sortedSets`)
      ])
    }
    return respHandler.sendResponse(req, res, { url })
  } catch (error) {
    respHandler.handleError(error, req, res)
  }
}

module.exports = {
  getNextRoute
}

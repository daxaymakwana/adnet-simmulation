const respHandler = require('../helper/resp-handler')
const redis = require('../redis')
const { toRedisPromise } = require('../util')
const redisNamespace = require('../helper/redis-namespaces')

module.exports = {
  createTarget,
  getAllTargets,
  getTarget,
  updateTarget
}

async function createTarget (req, res, options) {
  try {
    // get next seq id
    const id = await toRedisPromise(redis.INCRBY)(redisNamespace.targets.seqCount, 1)
    const targetObj = {
      id,
      url: options.body.url,
      value: options.body.value,
      maxAcceptsPerDay: options.body.maxAcceptsPerDay,
      accept: {
        geoState: options.body.accept.geoState || [],
        hour: options.body.accept.hour || []
      }
    }
    // create target payload for redis
    const targetPayload = Object.entries(targetObj).map((e) => {
      if (e[1] && typeof e[1] === 'object') {
        e[1] = JSON.stringify(e[1])
      }
      return e
    }).flat()
    await toRedisPromise(redis.HSET)(redisNamespace.targets.id(id), targetPayload)
    await toRedisPromise(redis.SADD)(redisNamespace.targets.list, String(id))

    // create sorted sets for each region and hours
    const sortedSetPromises = []

    targetObj.accept.geoState.map((geoState) => {
      targetObj.accept.hour.map((hour) => {
        const sortedSet = redisNamespace.route.stateAndHourSortedSets(geoState, hour)
        sortedSetPromises.push(
          toRedisPromise(redis.ZADD)(sortedSet, targetObj.value, targetObj.id),
          toRedisPromise(redis.SADD)(redisNamespace.targets.sortedSets(id), sortedSet)
        )
      })
    })

    await Promise.all(sortedSetPromises)

    respHandler.sendResponse(req, res, { msg: 'added successfully' }, 201)
  } catch (error) {
    respHandler.handleError(error, req, res)
  }
}

async function getAllTargets (req, res, options) {
  try {
    const targetIds = await toRedisPromise(redis.SMEMBERS)(redisNamespace.targets.list)
    let targets = []
    if (targetIds) {
      targets = await Promise.all(targetIds.map(s => toRedisPromise(redis.HGETALL)(redisNamespace.targets.id(s))))
      targets = targets.map(target => {
        target.accept = JSON.parse(target.accept)
        return target
      })
    }
    respHandler.sendResponse(req, res, { data: targets })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

async function getTarget (req, res, options) {
  try {
    const target = await toRedisPromise(redis.HGETALL)(redisNamespace.targets.id(options.params.id))
    if (target && target.accept) {
      target.accept = JSON.parse(target.accept)
    }
    respHandler.sendResponse(req, res, { data: target })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

async function updateTarget (req, res, options) {
  try {
    const id = options.params.id
    // create update object
    const targetObj = {
      id,
      url: options.body.url,
      value: options.body.value,
      maxAcceptsPerDay: options.body.maxAcceptsPerDay,
      accept: {
        geoState: options.body.accept.geoState || [],
        hour: options.body.accept.hour || []
      }
    }
    // create target payload for redis
    const targetPayload = Object.entries(targetObj).map((e) => {
      if (e[1] && typeof e[1] === 'object') {
        e[1] = JSON.stringify(e[1])
      }
      return e
    }).flat()

    await toRedisPromise(redis.HSET)(redisNamespace.targets.id(id), targetPayload)
    const sortedSets = await toRedisPromise(redis.SMEMBERS)(redisNamespace.targets.sortedSets(id))

    await Promise.all([
      ...sortedSets.map((sortedSet) => toRedisPromise(redis.ZREM)(sortedSet, id)),
      toRedisPromise(redis.DEL)(redisNamespace.targets.sortedSets(id))
    ])

    // create sorted sets for each region and hours
    const sortedSetPromises = []

    targetObj.accept.geoState.map((geoState) => {
      targetObj.accept.hour.map((hour) => {
        const sortedSet = redisNamespace.route.stateAndHourSortedSets(geoState, hour)
        sortedSetPromises.push(
          toRedisPromise(redis.ZADD)(sortedSet, targetObj.value, targetObj.id),
          toRedisPromise(redis.SADD)(redisNamespace.targets.sortedSets(id), sortedSet)
        )
      })
    })

    await Promise.all(sortedSetPromises)

    respHandler.sendResponse(req, res, { msg: 'updated successfully' })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

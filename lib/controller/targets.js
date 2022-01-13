const respHandler = require('../helper/resp-handler')
const redis = require('../redis')
const { toRedisPromise, redisHashPayload } = require('../util')
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
    const targetObj = constructTargetPayload(id, options.body)

    await toRedisPromise(redis.HSET)(redisNamespace.targets.id(id), redisHashPayload(targetObj))
    await toRedisPromise(redis.SADD)(redisNamespace.targets.list, String(id))

    await updateStateAndHourSortedSets({ id, value: targetObj.value, geoStates: targetObj.accept.geoState, hours: targetObj.accept.hour })

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
    const targetObj = constructTargetPayload(id, options.body)

    await toRedisPromise(redis.HSET)(redisNamespace.targets.id(id), redisHashPayload(targetObj))
    const sortedSets = await toRedisPromise(redis.SMEMBERS)(redisNamespace.targets.sortedSets(id))

    await Promise.all([
      ...sortedSets.map((sortedSet) => toRedisPromise(redis.ZREM)(sortedSet, id)),
      toRedisPromise(redis.DEL)(redisNamespace.targets.sortedSets(id))
    ])

    await updateStateAndHourSortedSets({ id, value: targetObj.value, geoStates: targetObj.accept.geoState, hours: targetObj.accept.hour })

    respHandler.sendResponse(req, res, { msg: 'updated successfully' })
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}

// to construct target payload
function constructTargetPayload (id, targetPayload) {
  return {
    id,
    url: targetPayload.url,
    value: targetPayload.value,
    maxAcceptsPerDay: targetPayload.maxAcceptsPerDay,
    accept: {
      geoState: targetPayload.accept.geoState || [],
      hour: targetPayload.accept.hour || []
    }
  }
}

async function updateStateAndHourSortedSets ({ id, value, geoStates, hours }) {
  // create sorted sets for each region and hours
  const sortedSetPromises = []

  geoStates.map((geoState) => {
    hours.map((hour) => {
      const sortedSet = redisNamespace.route.stateAndHourSortedSets(geoState, hour)
      sortedSetPromises.push(
        toRedisPromise(redis.ZADD)(sortedSet, value, id),
        toRedisPromise(redis.SADD)(redisNamespace.targets.sortedSets(id), sortedSet)
      )
    })
  })

  await Promise.all(sortedSetPromises)
}

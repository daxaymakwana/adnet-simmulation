const respHandler = require('../helper/resp-handler')
const redis = require('../redis')

async function createTarget (req, res, options) {
  try {
    // get next seq id
    const id = await redis.INCRBY('targets:seq_count', 1)
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
    await redis.HSET(`target:${id}`, targetPayload)
    await redis.SADD('targets:list', String(id))

    // create sorted sets for each region and hours
    const sortedSetPromises = []

    targetObj.accept.geoState.map((geoState) => {
      targetObj.accept.hour.map((hour) => {
        sortedSetPromises.push(redis.ZADD(`targets:geoState:${geoState}:hour:${hour}`, { score: targetObj.value, value: String(targetObj.id) }))
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
    const targetIds = await redis.SMEMBERS('targets:list')
    let targets = []
    if (targetIds) {
      targets = await Promise.all(targetIds.map(s => redis.HGETALL(`target:${s}`)))
      targets = targets.map(target => {
        target.accept = JSON.parse(target.accept)
        return target
      })
    }
    respHandler.sendResponse(req, res, { msg: 'added successfully', data: targets }, 201)
  } catch (error) {
    console.log(error)
    respHandler.handleError(error, req, res)
  }
}
module.exports = {
  createTarget,
  getAllTargets
}

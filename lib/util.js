const { promisify } = require('util')
const redis = require('./redis')

module.exports = {
  convertDateToIsoDateWithoutTime,
  toRedisPromise,
  redisHashPayload
}

function convertDateToIsoDateWithoutTime (date = new Date(), separator = '-') {
  return `${date.getUTCDate().toString().padStart(2, 0)}${separator}${(date.getUTCMonth() + 1).toString().padStart(2, 0)}${separator}${date.getUTCFullYear()}`
}

function toRedisPromise (command, client) {
  return promisify(command).bind(client || redis)
}

// to convert normal object to redis hash payload
function redisHashPayload (payload) {
  // create target payload for redis
  const targetPayload = Object.entries(payload).map((e) => {
    if (e[1] && typeof e[1] === 'object') {
      e[1] = JSON.stringify(e[1])
    }
    return e
  }).flat()
  return targetPayload
}

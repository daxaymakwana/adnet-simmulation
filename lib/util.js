const { promisify } = require('util')
const redis = require('./redis')

module.exports = {
  convertDateToIsoDateWithoutTime,
  toRedisPromise
}

function convertDateToIsoDateWithoutTime (date = new Date(), separator = '-') {
  return `${date.getUTCDate().toString().padStart(2, 0)}${separator}${(date.getUTCMonth() + 1).toString().padStart(2, 0)}${separator}${date.getUTCFullYear()}`
}

function toRedisPromise (command, client) {
  return promisify(command).bind(client || redis)
}

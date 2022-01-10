function convertDateToIsoDateWithoutTime (date = new Date(), separator = '-') {
  return `${date.getUTCDate().toString().padStart(2, 0)}${separator}${(date.getUTCMonth() + 1).toString().padStart(2, 0)}${separator}${date.getUTCFullYear()}`
}

module.exports = {
  convertDateToIsoDateWithoutTime
}

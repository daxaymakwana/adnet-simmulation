const { registerTargets } = require('./targets')

function registerRoutes (router) {
  registerTargets(router)
  console.log('All Routes registered')
}

module.exports = {
  registerRoutes
}

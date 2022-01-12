const { registerRoute } = require('./route')
const { registerTargets } = require('./targets')

module.exports = {
  registerRoutes
}

function registerRoutes (router) {
  registerTargets(router)
  registerRoute(router)
  console.log('All Routes registered')
}

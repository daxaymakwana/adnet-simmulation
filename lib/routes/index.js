const { registerRoute } = require('./route')
const { registerTargets } = require('./targets')

function registerRoutes (router) {
  registerTargets(router)
  registerRoute(router)
  console.log('All Routes registered')
}

module.exports = {
  registerRoutes
}

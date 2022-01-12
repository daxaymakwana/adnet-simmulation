
const targetController = require('../controller/targets')
const { notFoundRoute } = require('../helper/not-found')

module.exports = {
  registerTargets
}

function registerTargets (router) {
  // register targets routes
  router.set('api/targets', (req, res, op) => {
    // create target
    if (req.method === 'POST') {
      return targetController.createTarget(req, res, op)
    }
    // get targets
    if (req.method === 'GET') {
      return targetController.getAllTargets(req, res, op)
    }
    // send not found route
    return notFoundRoute(req, res)
  })
  // register targets by id routes
  router.set('api/targets/:id', (req, res, op) => {
    // get target
    if (req.method === 'GET') {
      return targetController.getTarget(req, res, op)
    }
    // update target
    if (req.method === 'POST') {
      return targetController.updateTarget(req, res, op)
    }
    // send not found route
    return notFoundRoute(req, res)
  })
}

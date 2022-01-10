
const targetController = require('../controller/targets')
const { notFoundRoute } = require('../helper/not-found')

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
}

module.exports = {
  registerTargets
}

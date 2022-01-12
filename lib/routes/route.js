
const routeController = require('../controller/route')
const { notFoundRoute } = require('../helper/not-found')

module.exports = {
  registerRoute
}

function registerRoute (router) {
  // register route
  // get route details
  router.set('route', (req, res, op) => {
    if (req.method === 'POST') {
      return routeController.getNextRoute(req, res, op)
    }
    // send not found route
    return notFoundRoute(req, res)
  })
}

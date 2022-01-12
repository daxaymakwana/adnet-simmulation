const sendJson = require('send-data/json')

module.exports = {
  notFoundRoute
}

// to send not found route error when route not found
function notFoundRoute (req, res) {
  res.statusCode = 404
  sendJson(req, res, {
    error: 'Route not found'
  })
}

const sendJson = require('send-data/json')

module.exports = {
  handleError,
  sendResponse
}

// to send not found route error when route not found
function handleError (err, req, res) {
  res.statusCode = 500
  sendJson(req, res, {
    error: err.message
  })
}

// to send success response
function sendResponse (req, res, data, statusCode = 200) {
  res.statusCode = statusCode
  sendJson(req, res, { ...(data || {}) })
}

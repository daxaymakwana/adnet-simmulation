const sendJson = require('send-data/json')

// to send not found route error when route not found
function handleError (err, req, res) {
  res.statusCode = 500
  sendJson(req, res, {
    error: err.message
  })
}

function sendResponse (req, res, data, statusCode = 200) {
  res.statusCode = statusCode
  sendJson(req, res, { ...(data || {}) })
}

module.exports = {
  handleError,
  sendResponse
}

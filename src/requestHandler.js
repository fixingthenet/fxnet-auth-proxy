function sendNotAuthorized(req, res) {
  res.writeHead(401, { "WWW-Authenticate": `Basic realm=${req.config.realm}`})
  res.end("<html><body>Authorization failed</body></html>")
}

//proprietary redirect
function sendRedirectToAuth(req, res) {
  const log = req.config.log
  var redirectUrl = `${req.config.authLoginUrl}?next=${encodeURIComponent(req.requestedUrl)}`
  log.debug("redirecting to", redirectUrl)
  res.writeHead(302,{ Location: redirectUrl})
  res.end()
}

function handleNoProxy(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end("<html><body>Authorization success</body></html>")
}

function handleProxy(req, res) {

}

//finds the
async function findAsync(arr, asyncCallback) {
  for (let i = 0; i < arr.length; i++) {
    console.log("Checking: ", i)
    var result = await asyncCallback(arr[i])
    console.log("Check done:", i, result)
    if (result) { break }
  }
}

const requestHandler = async function(req, res) {
  const logger = req.config.log
  req.requestedUrl = `${req.headers['x-forwarded-proto']}://${req.headers.host}${req.url}`
  logger.debug("Requested URL", req.requestedUrl)

  logger.debug("Authenticating")
  await findAsync(req.auths, async (auth) => {
    return await auth(req, res) //will set req.securityContext
  })

  //req.security_context = await authByCookie(req, res)

  if (!req.securityContext) {
    logger.debug("No security context")
    res.end()
    return Promise.resolve(false)
  } else {
    if (req.config.noProxy) {  // use case nginx-ingress is asking us
      logger.debug("Handling request in 'auth-only' mode.", req.securityContext)
      handleNoProxy(req, res)
      res.end()
      return Promise.resolve(true)
    } else {
      logger.debug("Proxying request", req.securityContext, req.config.protectedServiceUrl)
      await req.proxy.web(req, res, { target: req.config.protectedServiceUrl });
      return Promise.resolve(true)
    }
  }
}

module.exports = {
  requestHandler,
  sendNotAuthorized,
  sendRedirectToAuth,
  handleProxy,
  handleNoProxy,
  default: requestHandler
}

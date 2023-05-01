// See https://github.com/nodejitsu/node-http-proxy#modify-a-response-from-a-proxied-server for docs.

// how it works:
// auth-only mode: check authentification and return 200 or 401 page, this usually works as a sidecar to an nginx-ingress


// proxy mode: check authentification and proxy to a backend

//
// common

const config = require('./config');
const {requestHandler} = require('./requestHandler');
const keystore = require('./keystore');

const auths = [ require('./authCookie').default, require('./authOAuth').default, ];

var http = require('http');
var httpProxy = require('http-proxy');

const cookieParser = require('cookie');

const proxy = httpProxy.createProxyServer()
const server = http.createServer( async function(req,res) {
  req.proxy = proxy
  req.auths = auths
  req.config = config

  try {
    req.cookies=cookieParser.parse(req.headers.cookie)
  } catch(e) {
    req.cookies={}
  }
  await requestHandler(req,res)
})

proxy.on('error', function(err) {
  return config.log.error(err);
});

// default middlewares before dispatching to the proxy
// override hostname
proxy.on('proxyReq', async function(proxyReq, req, res, options) {
  if (req.config.overrideTargetHost) {
    proxyReq.setHeader('host', req.config.overrideTargetHost)
  }
});

/*proxy.on('proxyReq', async function(proxyReq, req, res, options) {
  var securityContext = req.securityContext
  proxyReq.setHeader('x-proxy-user', securityContext.toJSON());
});*/

server.listen(config.listenPort)
if (config.keyStore.updateInterval > 0) {
  keystore.installKeystoreFetcher(config.authCookie.issuer, config.keyStore.updateInterval)
  config.log.notice(`Installing Jwks updater on '${config.authCookie.issuer}' updating ${config.keyStore.updateInterval / 60 } minutes `)
} else {
  config.log.notice('No Jwks updater')
}

config.log.notice(`Auth proxy started on port ${config.listenPort}`)

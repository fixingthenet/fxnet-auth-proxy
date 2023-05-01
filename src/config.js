var log = require('log'); // https://www.npmjs.com/package/log
require("log-node")();

const ONE_DAY = 24 * 60 * 60
var UNDEFINED

function e(name, opts = {}  ) {
  var envValue = process.env[name]
  opts.type = opts.type || 'string'
  
  if (envValue === UNDEFINED ) {
    envValue = opts.def
  }
  if (envValue === UNDEFINED && opts.required) {
    log.error(`Setting ${name} is requried!`)
    throw 'Configuration error'
  }
  
  log.notice(`Setting: ${name} = ${envValue} ${opts.type}`)

  switch(opts.type) {
    case 'bool':
    case 'boolean':
      return envValue == 'true'
      break;
    case 'numeric':
    case 'integer':
      return parseInt(envValue,10)
      break;
    default:
      return envValue
  }  
  
}


const config = {
  redirectToAuth: e("REDIRECT_TO_AUTH", { type: 'bool' }),  // redirect to frontend when no authorized or just return 401?
  account_api_url: e("ACCOUNT_API_URL"), // the internal server name where to proxy to do api calls (is special in dev envs)
  noProxy: e("NO_PROXY", {type: 'bool'}),
  listenPort: e("LISTEN_PORT", {type: 'integer', def: 8080}),

  
  expiresIn: e("AUTH_EXPIRES_IN", {type: 'integer', def: ONE_DAY}),
  //for proprietary login
  authLoginUrl: e("AUTH_LOGIN_URL"), // something like https://auth.dev.fixingthe.net/login
  authCookie: {
    name: e("AUTH_NAME",'string', { required: true, def: 'fxnetauth' }),
    issuer: e("AUTH_ISSUER", { required: true }),
    secret: e("AUTH_SECRET", { required: true }) //legacy auth
  },
  authOpenIdConnect: {
    clientId: e("AUTH_OPENID_CLIENT_ID", {required: true}),
    clientSecret: e("AUTH_OPENID_CLIENT_SECRET"),
    redirectUri: e("AUTH_OPENID_REDIRECT_URI"),
    issuer: e("AUTH_ISSUER")
  },
  
  keyStore: {
    updateInterval: e('KEYSTORE_UPDATE_INTERVAL', {type: 'integer', required: true, def: 0}) // how often to update in seconds
  },
  realm: "FXNET auth",

  //if proxied
  protectedServiceUrl: process.env["PROTECTED_SERVICE_URL"], //
  overrideTargetHost:  process.env["OVERRIDE_TARGET_HOST"],

  log: log
}

module.exports = config

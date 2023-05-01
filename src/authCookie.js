// config.authCookie.name
// config.authCookie.audience
// config.authCookie.issuer

// the cookie should hold a valid JWT
// validation is done on: iat, iss and aud

const { getKeystore } = require('./keystore');

const jwt=require('jsonwebtoken')
const jws = require('jws')
const jwktopem=require('jwk-to-pem')

async function authCookie(req) {
  try {
    const logger = req.config.log
    logger.debug("headers:", req.cookies, req.config.authCookie.name)
    var jwtString = req.cookies[req.config.authCookie.name];
    var decoded = jws.decode(jwtString)
    var key = req.config.authCookie.secret
    var payload = jwt.verify(jwtString, key,
                             {
                               algorithms: ['HS256'],
                               ignoreExpiration: true
                             }
                             ) // ignoreNotBefore ignoreExpiration clockTolreance audience issuer


    req.securityContext = payload
    logger.debug("Cookies auth", jwtString, decoded, key)
    return Promise.resolve(true)
  } catch(e) {
    req.config.log.warn("cookie error:", e);
    return Promise.resolve(false)
  }

}

module.exports = {
  authCookie,
  default: authCookie
}

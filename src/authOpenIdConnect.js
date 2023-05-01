// config.authOpenIdConnect.clientId
// config.authOpenIdConnect.clientSecret
// config.authOpenIdConnect.redirectUri


// the cookie should hold a valid JWT
// validation is done on: iat, iss and aud

const OAuthClient = require('intuit-oauth');
const { getIssuer, getKeystore } = require('./keystore');

const jwt=require('jsonwebtoken')
const jws = require('jws')
const jwktopem=require('jwk-to-pem')

async function authOpenIdConnect(req, res) {

  const logger = req.config.log

  const issuer = getIssuer(req.config.authOpenIdConnect.issuer)
  OAuthClient.authorizeEndpoint = issuer.authorization_endpoint
  OAuthClient.tokenEndpoint = issuer.token_endpoint

  const oauthClient = new OAuthClient({
    clientId: req.config.authOpenIdConnect.clientId,
    clientSecret: req.config.authOpenIdConnect.clientSecret,
    environment: 'production',
    redirectUri: req.config.authOpenIdConnect.redirectUri,
  });
  oauthClient.logger = logger

  logger.debug("openID:", req.url) //, authUri, OAuthClient, issuer)

  if (req.url.startsWith('/fxnap/oidc/callback?')) {
    try {
      logger.debug('Verifying token');
      var authResponse = await oauthClient.createToken(req.url)
      logger.debug(1);
      var { id_token, access_token } = authResponse.getJson()
      logger.debug(2);
      var decoded = jws.decode(id_token)
      logger.debug('Verifying token is', id_token, decoded);
      var key = jwktopem(getKeystore(req.config.authOpenIdConnect.issuer).get(decoded.header.kid).toJSON(true))
      var payload = jwt.verify(id_token, key,
                               {
                                 algorithms: ['RS256'],
                                 //ignoreExpiration: true,
                                 audience: req.config.authOpenIdConnect.clientId,
                                 issuer: req.config.authOpenIdConnect.issuer,
                               }
                              ) // ignoreNotBefore ignoreExpiration clockTolerance
      //generating a symetric HS256 jwt, set the token and securityContext
      var localPayload= {
        userId: payload.sub,
      }
      var encodeKey = req.config.authCookie.secret
      var encoded = jwt.sign(localPayload, encodeKey, { algorithm: 'HS256', expiresIn: req.config.expiresIn })
      res.setHeader('Set-Cookie', [`${req.config.authCookie.name}=${encoded}; Path=/`] )
      res.setHeader('Location', req.cookies.requestedUrl)
      res.statusCode=302;
      return true
    } catch(e) {
      logger.error('Error', e)
      res.statusCode = 401
    }
  } else {
    var authState="someRandom"
    const authUri = oauthClient.authorizeUri({
      scope: ['openid'],
      state: authState,
    });
    res.statusCode=302;
    res.setHeader('Location',authUri);
    res.setHeader('Set-Cookie', [`requestedUrl=${req.url};  Path=/`, `state=${authState};  Path=/`])
    logger.debug('redirecting to auth', authUri)
  }

  //return res.end();

}

module.exports = {
  authOpenIdConnect,
  default: authOpenIdConnect
}

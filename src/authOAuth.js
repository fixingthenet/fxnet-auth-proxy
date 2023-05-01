// config.authOpenIdConnect.clientId
// config.authOpenIdConnect.clientSecret
// config.authOpenIdConnect.redirectUri


// the cookie should hold a valid JWT
// validation is done on: iat, iss and aud

/*    https://conceptboard.com/ns/oauth#scope-user.meta

        Read user information (e.g. name, settings, e-mail)

    https://conceptboard.com/ns/oauth#scope-board.meta

        Read board information (e.g. name, createdat, settings)

        Read board authorization information

    https://conceptboard.com/ns/oauth#scope-board.meta.write

        Modify board information

        Modify board authorization information

    https://conceptboard.com/ns/oauth#scope-board.content

        Read board content (e.g. exports)

    https://conceptboard.com/ns/oauth#scope-board.activity

        Read board activities

    https://conceptboard.com/ns/oauth#scope-offline
*/

const OAuthClient = require('intuit-oauth');
const { getIssuer, getKeystore } = require('./keystore');

const jwt=require('jsonwebtoken')
const jws = require('jws')
const jwktopem=require('jwk-to-pem')

async function authOAuth(req, res) {

  const logger = req.config.log

//  const issuer = getIssuer(req.config.authOpenIdConnect.issuer)
  OAuthClient.authorizeEndpoint = 'https://dev.conceptboard.com/cbapi/oauth2/authorize'
  OAuthClient.tokenEndpoint = 'https://dev.conceptboard.com/cbapi/oauth2/token'

  const oauthClient = new OAuthClient({
    clientId: req.config.authOpenIdConnect.clientId,
    clientSecret: req.config.authOpenIdConnect.clientSecret,
    environment: 'production',
    redirectUri: req.config.authOpenIdConnect.redirectUri,
  });
  oauthClient.logger = logger

  logger.debug("oAuth:", req.url) //, authUri, OAuthClient, issuer)

  if (req.url.startsWith('/fxnap/oidc/callback?')) {
    try {
      logger.debug('Verifying token');
      var authResponse = await oauthClient.createToken(req.url)

      
      logger.debug(1,authResponse);
      var { id_token, access_token } = authResponse.getJson()
      logger.debug(2,access_token);
      
      //var decoded = jws.decode(id_token)
      //logger.debug('Verifying token is', id_token, decoded);
      //var key = jwktopem(getKeystore(req.config.authOpenIdConnect.issuer).get(decoded.header.kid).toJSON(true))
      var key = "3vbT7GO2o4qJQADh36909_i9E0w21kv_E14iOIg3TNih1mVZfd7vCG_7TSz9GcUYadyNrAEOCG_PlLrtifynvOEwYIqZbtrLbCxyPp-r2gNntP4u4CPGPfm298QMq4LmEdXyUMa7F6-iYFg5YlteoPB7CjkHNvxb_fBWbSbcAlsF6kIGnJyCkvwOKrzx24Yh5xSOGueSCc8ndq-eYuWIFPn7_-GABKtKOBSG4CF9hIlMZytMt0tdzm8ECUPj6riCBSEvtMDZXf9PBp56l3L4GbZmL5p7ai3SyrDiUvGdxzSb6e7bAL5orcQTfg8n7_GulqlkKUxEW8fz0oXyrwvTQA"
      var payload = jwt.verify(access_token, Buffer.from(key, 'base64'),
                               {
                                 algorithms: ['HS256'],
                                 //ignoreExpiration: true,
                                 //audience: req.config.authOpenIdConnect.clientId,
                                 audience: req.config.authOpenIdConnect.issuer,
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
      scope: ['https://conceptboard.com/ns/oauth#scope-user.meta'],
      state: authState,
    });
    console.debug("AuthURI: ", oauthClient, authUri);
    res.statusCode=302;
    res.setHeader('Location',authUri);
    res.setHeader('Set-Cookie', [`requestedUrl=${req.url};  Path=/`, `state=${authState};  Path=/`])
    logger.debug('redirecting to auth', authUri)
  }

  //return res.end();

}

module.exports = {
  authOAuth,
  default: authOAuth
}

const cookie_parser = require('cookie');

async function authByAuthorizationHeader(req) {
  // console.log("got request",req.headers)
  var auth = req.headers.authorization
  var security_context

  log.debug("auth via Authorization header")
  if (auth) { // got an auth header? then check ...
    security_context = await getSecurityContext(auth);
  }
  return security_context
}

async function authByCookie(req) {
  var security_context
  try {
    // log.debug("requested url", requestedUrl )

    var result = cookie_parser.parse(req.headers.cookie)[cookie_name];
    var sc = JSON.parse(result)

    // we can't trust the cookies so we'll query the api
    var auth = 'Basic ' + Buffer.from(`api_key:${sc.user.api_key}`).toString('base64') //simulating an authorisation header
    security_context = await getSecurityContext(auth);
  } catch(e) {
    log.warn("cookie error:", e);
  }
  return security_context
}

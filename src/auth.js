// See https://github.com/nodejitsu/node-http-proxy#modify-a-response-from-a-proxied-server for docs.

// how it works:
// auth-only mode: check authentification and return 200 or 401 page, this usually works as a sidecar to an nginx-ingress


// proxy mode: check authentification and proxy to a backend

//
// common

const config = require('src/config');
const requestHandler = require('src/requestHandler');

const cookie_parser = require('cookie');

var http = require('http');
var httpProxy = require('http-proxy');
var axios = require('axios');

const basicRegexp = /Basic (.*)$/;
const usernamePasswordRegexp = /([^:]+)\:(.*)/;

const proxy = httpProxy.createProxyServer(requestHandler)

proxy.on('error', function(err) {
  return config.log.error(err);
});

proxy.on('proxyReq', async function(proxyReq, req, res, options) {
  var securityContext = req.securityContext

  if (req.config.overrideTargetHost) {
    proxyReq.setHeader('host', req.config.overrideTargetHost)
  }

//  proxyReq.setHeader('x-proxy-user', securityContext.permissions.user);
});

// auth is a Basic auth header but is also used in Cookie based auth
// returns a security_context or nil
// caches the security context

async function getSecurityContext(auth) {
  var security_context;
  var encodedAuth=auth.match(basicRegexp)[1];
  var usernamePassword = Buffer.from(encodedAuth, 'base64').toString('ascii');
  var [match, username, password] = usernamePassword.match(usernamePasswordRegexp)

  log.debug("got request", username)

  var cached = cache[encodedAuth]

  if (cached) {
    if (new Date().getTime() < cached.cachedAt + cacheTime) {
      security_context = cached
      log.debug("cache fresh", security_context.user.email)
    } else {
      log.debug("cache old")
    }
  } else {
    log.debug("cache miss")
  }

  if (!security_context) { // no cached user yet?
    try {
      log.debug("login with memberships", username)
      var authenResp = await axios.post(authen_url,
        { email: username, password: password }
      );
      // log.notice("authenResp", authenResp.data.data)
      if (authenResp.data.data.user) {
        var authedUser = authenResp.data.data.user

        security_context = {
          user: authedUser,
          cachedAt: new Date().getTime()
        }
        log.debug("authorized:", authedUser.email, new Date().getTime())
      }
    } catch(e) {
      log.warn("authentication failed", e.message)
    }
  }

  if (security_context) {
    await getPermissionsForMetodaInternalBi(username, password, security_context);
  }

  if (security_context) {
    cache[encodedAuth] = security_context;
  }
  return security_context;
}

async function getPermissionsForMetodaInternalBi(username, password, security_context) {
  let user = security_context.user.public_id;
  let apiKey = security_context.user.api_key;

  var role;
  var dataBucketIds = "[]";

  var permissionsUrl = `${account_api_url}/api/v1/authorization/permissions?user_public_id=${user}&app_public_id=${PERMISSIONS_QUERY_APP_PUBLIC_ID}&api_key=${apiKey}`
  var permissionsResp;

  try {
    permissionsResp = await axios.get(permissionsUrl);
  } catch(e) {
    log.warn("authorization request failed", e.message)
  }

  if (permissionsResp) {
    var permissions = permissionsResp.data.data;

    permissions = permissions.filter(p => {
      return p.attributes.resource === PERMISSIONS_QUERY_RESOURCE;
    });

    permissions = permissions.map(p => {
      return JSON.parse(p.attributes.selector)[PERMISSIONS_QUERY_SELECTOR_ATTRIBUTE];
    }).filter(p => p !== undefined);

    permissions.sort();

    permissions = [...new Set(permissions)];

    if (permissions.find(p => p === '*')) {
      role = 'admin';
    } else {
      role = 'restricted_access';

      dataBucketIds = JSON.stringify(permissions);
    }
  }

  security_context.permissions = {
    user: user,
    role: role,
    data_bucket_ids: dataBucketIds,
  };

  console.debug('security_context.permissions:', security_context.permissions);

  return security_context;
}

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

server.listen(80)

log.notice(`Auth proxy started on port 80\naccount_api_url: ${account_api_url}\nauth_login_url: ${auth_login_url}\nprotected_service_url: ${protected_service_url}\nno_proxy: ${no_proxy}`)

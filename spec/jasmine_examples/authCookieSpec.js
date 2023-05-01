describe("authCookie", function() {
  const { setKeystore, getKeystore, keystore} = require("../../src/keystore") ;
  
  const { authCookie } = require('../../src/authCookie');
  var req;
  var res;
  var config;
  
  beforeEach(async function() {
      config = {
//    redirectToAuth: process.env["REDIRECT_TO_AUTH"], // redirect to frontend when no authorized?
//    accountapi_url: process.env["ACCOUNT_API_URL"], // the internal server name where to proxy to do api calls (is special in dev envs)
    noProxy: true,
//    cookie_name: process.env["ACCOUNT_COOKIE_NAME"], // usually something like xxx_(development|staging|production)
    authLoginUrl: 'https://auth.dev.fixingthe.net/login',
//    realm: "FXNET auth",
    protectedServiceUrl: "http://ok.proxied.com", 
//  override_target_host:  process.env["OVERRIDE_TARGET_HOST"],
    log: console,
    authCookie: { 
      name: "fxnet",
      issuer: "https://auth.dev.fixingthe.net",
      audience: "app.fx.net",
      secret: "824ea2b06e3554653f558090e95daf761b26116c6f459db78c9d2ec80a3e2f6b0d7c1355bcb37b9a3df0933a1fa0b5857ba902e1bb211c9ef82fd621811471bb"
    }
  }
    await setKeystore("https://auth.dev.fixingthe.net", {
      keys: [    {
      kty: 'RSA',
      kid: '1',
      use: 'sig',
      alg: 'RS256',
      e: 'AQAB',
      n: 'pKybs0WaHU_y4cHxWbm8Wzj66HtcyFn7Fh3n-99qTXu5yNa30MRYIYfSDwe9JVc1JUoGw41yq2StdGBJ40HxichjE-Yopfu3B58QlgJvToUbWD4gmTDGgMGxQxtv1En2yedaynQ73sDpIK-12JJDY55pvf-PCiSQ9OjxZLiVGKlClDus44_uv2370b9IN2JiEOF-a7JBqaTEYLPpXaoKWDSnJNonr79tL0T7iuJmO1l705oO3Y0TQ-INLY6jnKG_RpsvyvGNnwP9pMvcP1phKsWZ10ofuuhJGRp8IxQL9RfzT87OvF0RBSO1U73h09YP-corWDsnKIi6TbzRpN5YDw'
     }]}, {})

 
    req= {config: config,
          auths: [],
          headers: { 'x-forwarded-proto': 'https', 
                     'host': 'test.fixingthe.net',
                   }, 
          url: '/test',
    }
    res = { code: 0, 
            headers: {},
            body: null,
            writeHead: (code, heads) => { res.code = code; this.headers=heads }, 
            end: (body) => { res.ended = true; res.body = body } }
  });

  describe("when not set", function() {
    it("doesn't set securityContext", async function() {
       authCookie(req,res)
       expect( res.securityContext ).toBeFalsy();
    });

    it("sets the securityContext from cookie payload", async function() {
      console.log("test_keystore", getKeystore(req.config.authCookie.issuer), keystore, req.config.authCookie.issuer )
      req.headers.cookie = "fxnet=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJkYXRhIjp7InVzZXJfaWQiOjEsImxvZ2luIjoiYWRtaW4ifSwiZXhwIjoxNjM2OTk2MjkyfQ.V52xZBIOXpbkvaX8DxRGJDAFt8zXxmbfGiatJRt__sY"
      authCookie(req)
      expect( req.securityContext ).toBeTruthy();
    });
  });
})

/*    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
      expect(function() {
        player.resume();
      }).toThrowError("song is already playing");
*/

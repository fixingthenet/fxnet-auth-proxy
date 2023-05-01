describe("Handler", function() {
  const { requestHandler } = require('../../src/requestHandler');
  var req;
  var res;
  var config;
  var proxy;
  
  beforeEach(function() {
      config = {
//    redirectToAuth: process.env["REDIRECT_TO_AUTH"], // redirect to frontend when no authorized?
//    accountapi_url: process.env["ACCOUNT_API_URL"], // the internal server name where to proxy to do api calls (is special in dev envs)
    noProxy: true,
//    cookie_name: process.env["ACCOUNT_COOKIE_NAME"], // usually something like xxx_(development|staging|production)
    authLoginUrl: 'https://auth.dev.fixingthe.net/login',
    protectedServiceUrl: "http://ok.proxied.com", 
//  override_target_host:  process.env["OVERRIDE_TARGET_HOST"],
    log: console
  }

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
    proxy = {
      req: null,
      resp: null,
      options: {},
      web: function(request, response, options) { proxy.req=request, proxy.resp = response, proxy.options=options, proxy.called = true }
    }    
  });

  describe("when not authenticated", function() {
    it("redirects to authLoginUrl", function() {
       requestHandler(req,res)
       expect( res.code ).toEqual(302);
    });

    it("returns not authorized if no login url is given", function() {
      req.config.authLoginUrl = null
      requestHandler(req,res)
      expect( res.code ).toEqual(401);
    });
  });
  
  describe("when authenticated", function() {
    beforeEach(function() {
      req.securityContext = { userId: 1 }
    });
    
    describe("when not proxiing", function() {
      it("returns 200 when nt proxied", function() {
        requestHandler(req,res)
        expect(res.code).toEqual(200);
        expect(res.body).toMatch(/success/)
      });
    })

    describe("when proxiing", function() {
      beforeEach(function() {
        req.config.noProxy=false
        req.proxy = proxy
      })
      
      it("should dispatch to the proxy", function() {
        requestHandler(req,res)
        expect(proxy.called).toBeTruthy();
        expect(proxy.options.target).toEqual(config.protectedServiceUrl)
      } )
    });
  });
})

/*    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
      expect(function() {
        player.resume();
      }).toThrowError("song is already playing");
*/

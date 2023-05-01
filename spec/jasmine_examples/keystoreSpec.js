describe("keystore", function() {
  const { setKeystore, getKeystore, keystores} = require("../../src/keystore") ;
  
  var ks
  
  beforeEach(async function() {
    ks=await setKeystore("https://auth.dev.fixingthe.net", {
      keys: [    {
      kty: 'RSA',
      kid: '1',
      use: 'sig',
      alg: 'RS256',
      e: 'AQAB',
      n: 'pKybs0WaHU_y4cHxWbm8Wzj66HtcyFn7Fh3n-99qTXu5yNa30MRYIYfSDwe9JVc1JUoGw41yq2StdGBJ40HxichjE-Yopfu3B58QlgJvToUbWD4gmTDGgMGxQxtv1En2yedaynQ73sDpIK-12JJDY55pvf-PCiSQ9OjxZLiVGKlClDus44_uv2370b9IN2JiEOF-a7JBqaTEYLPpXaoKWDSnJNonr79tL0T7iuJmO1l705oO3Y0TQ-INLY6jnKG_RpsvyvGNnwP9pMvcP1phKsWZ10ofuuhJGRp8IxQL9RfzT87OvF0RBSO1U73h09YP-corWDsnKIi6TbzRpN5YDw'
     }]}, {})
  });

  describe("when filled", function() {
    it("returns the key", async function() {
//      console.log("keystore test", keystores, ks)
      expect( keystores["https://auth.dev.fixingthe.net"] ).toBeTruthy();
    });
  });
})

/*    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
      expect(function() {
        player.resume();
      }).toThrowError("song is already playing");
*/

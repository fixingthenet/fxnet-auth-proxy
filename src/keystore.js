const issuers = {} //storing issuer by issuerUrl
const keystores = {} //storing keysstore by issuerUrl

const { Issuer } = require('openid-client');
const jose = require('node-jose');
const axios = require('axios');

function installKeystoreFetcher(issuerUrl, interval) {
  const setter = function() {
    try {
    updateKeystore(issuerUrl)
    } catch (e) {
      console.log("Jwks updater problem: ",e)
    }
    setTimeout(setter, interval , "issuerUpdate")
  }
  setTimeout(setter, 100 , "issuerUpdate")
}

// this will be run from time to timeand does communication
async function updateKeystore(issuerUrl) {
  var iss = await Issuer.discover(issuerUrl)
  var jwksString = (await axios.get(iss.jwks_uri)).data
  setKeystore(issuerUrl, jwksString, iss)
}

//this is used in tests to store things
async function setKeystore(issuerUrl, jwks, iss) {
  var keystore = await jose.JWK.asKeyStore(jwks)
//  console.log("keysore", issuerUrl,  jwks, keystore.toJSON(true))
  issuers[issuerUrl] = iss
  keystores[issuerUrl] = keystore
  return keystore
}

function getKeystore(issuerUrl) {
  return keystores[issuerUrl]
}
function getIssuer(issuerUrl) {
  return issuers[issuerUrl]
}

module.exports = {

  keystores,
  installKeystoreFetcher,
  setKeystore,
  updateKeystore,
  getKeystore,
  getIssuer,
  default: getKeystore
}

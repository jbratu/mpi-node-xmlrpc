var xmlrpc = require('../lib/xmlrpc.js')

let clientOptions = "https://direct-ppro.modernparking.net/OI/oecgi3.exe/call_parkpro";
let client = xmlrpc.createSecureClient(clientOptions)
client.options.encoding = 'utf-8';

let rpcHeaders = {
  version: 1,
  key: 'luome6hkd17fd2qkuj49om6sn7'
};

let locations = await client.listLocations(rpcHeaders, 'listLocations');
console.log(locations);
var xmlrpc = require('../lib/xmlrpc.js')

const RPC_URL = "http://direct-ppro.modernparking.net/OI/oecgi3.exe/call_parkpro";
const client = xmlrpc.createClient(RPC_URL);
client.logXML("C://repos");

//
// MPI RPC Specific Payload Headers
//
var headers = {
    version: 1,
    key: 'REDACTED'
};

//
// MPI RPC Specific Payload Parameters
//
var parameters = [];
parameters['shift'] = '1';
parameters['date'] = '01/05/2025';

// Combine the header and parameters into a single payload
var rpcParameters = {
    header: {header: headers},
    parameters: {parameters: Object.assign({}, parameters)}
}

let rpcMethod = 'pullWebDRE';
client.options.encoding = 'utf-8';


async function main() {
    console.log(`Calling ${rpcMethod}...`);
    // Sends a method call to the XML-RPC server

    // Generic method to call RPC methods

    let dre = await client.methodCall(rpcMethod, rpcParameters, function (error, value) {
        // Results of the method response
        console.log(`Method response for '${rpcMethod}': `, value.data[0])

        if (error !== null) {
            console.log(error);
        }
    });
    console.log(dre);

    // This also works but requires changes to the client for every method
    /*
    let rpcHeaders = {
        version: 1,
        key: 'REDACTED'
    };

    let dre = await client.pullWebDRE(rpcHeaders, 'pullWebDRE', parameters);
    console.log(dre);
     */

}

// Log the request / response
client.logXML("C://temp");

main();

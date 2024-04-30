var http         = require('http')
  , https        = require('https')
  , url          = require('url')
  , Serializer   = require('./serializer')
  , Deserializer = require('./deserializer')
  , Cookies      = require('./cookies')
  , Logs      = require('./logs')

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {Object|String} options - Server options to make the HTTP request to.
 *                                  Either a URI string
 *                                  (e.g. 'http://localhost:9090') or an object
 *                                  with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 *   - {String} url               - (optional) - may be used instead of host/port pair
 *   - {Boolean} cookies          - (optional) - if true then cookies returned by server will be stored and sent back on the next calls.
 *                                  Also it will be possible to access/manipulate cookies via #setCookie/#getCookie methods
 * @param {Boolean} isSecure      - True if using https for making calls,
 *                                  otherwise false.
 * @return {Client}
 */
function Client(options, isSecure) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(options, isSecure)
  }

  // If a string URI is passed in, converts to URI fields
  if (typeof options === 'string') {
    options = url.parse(options)
    options.host = options.hostname
    options.path = options.pathname
  }

  if (typeof options.url !== 'undefined') {
    var parsedUrl = url.parse(options.url);
    options.host = parsedUrl.hostname;
    options.path = parsedUrl.pathname;
    options.port = parsedUrl.port;
  }

  // Set the HTTP request headers
  var headers = {
    'User-Agent'     : 'NodeJS XML-RPC Client'
  , 'Content-Type'   : 'text/xml'
  , 'Accept'         : 'text/xml'
  , 'Accept-Charset' : 'UTF8'
  , 'Connection'     : 'Keep-Alive'
  }
  options.headers = options.headers || {}

  if (options.headers.Authorization == null &&
      options.basic_auth != null &&
      options.basic_auth.user != null &&
      options.basic_auth.pass != null)
  {
    var auth = options.basic_auth.user + ':' + options.basic_auth.pass
    options.headers['Authorization'] = 'Basic ' + new Buffer.from(auth).toString('base64')
  }

  for (var attribute in headers) {
    if (options.headers[attribute] === undefined) {
      options.headers[attribute] = headers[attribute]
    }
  }

  options.method = 'POST'
  this.options = options

  this.isSecure = isSecure
  this.headersProcessors = {
    processors: [],
    composeRequest: function(headers) {
      this.processors.forEach(function(p) {p.composeRequest(headers);})
    },
    parseResponse: function(headers) {
      this.processors.forEach(function(p) {p.parseResponse(headers);})
    }
  };
  if (options.cookies) {
    this.cookies = new Cookies();
    this.headersProcessors.processors.unshift(this.cookies);
  }
  this.logs = new Logs();
}

Client.prototype.logXML = function methodCall(logFolderLocation) {
  this.logs.setLogLocation(logFolderLocation);
}

/**
 * Makes an XML-RPC call to the server specified by the constructor's options.
 *
 * @param {String} method     - The method name.
 * @param {Array} params      - Params to send in the call.
 * @param {Function} callback - function(error, value) { ... }
 *   - {Object|null} error    - Any errors when making the call, otherwise null.
 *   - {mixed} value          - The value returned in the method response.
 */
Client.prototype.methodCall = async function methodCall(method, params) {
  var options   = this.options
  var xml       = Serializer.serializeMethodCall(method, params, options.encoding)
  var transport = this.isSecure ? https : http

  this.logs.saveRequestLogs(xml);

  options.headers['Content-Type'] = 'application/xml';
  options.headers['Content-Length'] = Buffer.byteLength(xml, 'utf8')

  delete options.headers['User-Agent'];
  delete options.headers['Accept'];
  delete options.headers['Accept-Charset'];
  delete options.headers['Connection'];

  this.headersProcessors.composeRequest(options.headers)
  
  return new Promise((resolve, reject) => {
    
    var request =  transport.request(options, (response) => {
    
    var body = []
    response.on('data', function (chunk) { 
      this.logs.saveResponseLogs(chunk);
      body.push(chunk);
     }.bind(this))

    function __enrichError (err) {
      Object.defineProperty(err, 'req', { value: request })
      Object.defineProperty(err, 'res', { value: response })
      Object.defineProperty(err, 'body', { value: body.join('') })
      return err
    }

    if (response.statusCode == 404) {
      reject(__enrichError(new Error('Not Found')));
      // callback(__enrichError(new Error('Not Found')))
    }
    else {
      this.headersProcessors.parseResponse(response.headers)
      
      var deserializer = new Deserializer(options.responseEncoding)

      deserializer.deserializeMethodResponse(response, (err, result) => {
        if (err) {
          err = __enrichError(err)
          reject(err);
        }
        resolve(result);
      })
    }
    })

    request.on('error', function(err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    request.write(xml, 'utf8')
    request.end()

  });
}

/**
 * Gets the cookie value by its name. The latest value received from servr with 'Set-Cookie' header is returned
 * Note that method throws an error if cookies were not turned on during client creation (see comments for constructor)
 *
 * @param {String} name name of the cookie to be obtained or changed
 * @return {*} cookie's value
 */
Client.prototype.getCookie = function getCookie(name) {
  if (!this.cookies) {
    throw 'Cookies support is not turned on for this client instance';
  }
  return this.cookies.get(name);
}

/**
 * Sets the cookie value by its name. The cookie will be sent to the server during the next xml-rpc call.
 * The method returns client itself, so it is possible to chain calls like the following:
 *
 * <code>
 *   client.cookie('login', 'alex').cookie('password', '123');
 * </code>
 *
 * Note that method throws an error if cookies were not turned on during client creation (see comments for constructor)
 *
 * @param {String} name name of the cookie to be changed
 * @param {String} value value to be set.
 * @return {*} client object itself
 */
Client.prototype.setCookie = function setCookie(name, value) {
  if (!this.cookies) {
    throw 'Cookies support is not turned on for this client instance';
  }
  this.cookies.set(name, value);
  return this;
}

module.exports = Client


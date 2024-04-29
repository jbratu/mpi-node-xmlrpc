const fs = require('fs');


function Logs() {
  this.logs = {}
}

Logs.prototype = {

  setLogLocation: function(logLocation) {
    this.logs.location = logLocation;
  },

  saveRequestLogs: function(log) {
    if(this.logs.location) {
      log = "\n\n"+"XML-RPC Request is:\n\n"+log+"\n\n";
      fs.appendFileSync(this.logs.location+"/logs-"+process.pid+".txt", log);
    }
  },

  saveResponseLogs: function(log) {
    if(this.logs.location) {
      log = "\n\n"+"XML-RPC Response is:\n\n"+log+"\n\n";
      fs.appendFileSync(this.logs.location+"/logs-"+process.pid+".txt", log);
    }
  }
}

module.exports = Logs

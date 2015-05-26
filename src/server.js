var Static = require('node-static');
var config = require('./config.js');
var file = new Static.Server();

module.exports = function() {
  require('http').createServer(function (request, response) {
    request.addListener('end', function () {
      file.serve(request, response);
    }).resume();
  }).listen(config.HTTP.port);

  console.log('listening on http://localhost:' + config.HTTP.port);
};
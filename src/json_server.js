function startServer(processMessage, port = 9838) {
  var net = require('net');
  var JsonSocket = require('json-socket');

  var server = net.createServer();
  server.listen(port);
  server.on('connection', function(socket) {
    //This is a standard net.Socket
    socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
    socket.on('message', function(message) {
      processMessage(message);
    });
  });
}

module.exports.startServer = startServer;

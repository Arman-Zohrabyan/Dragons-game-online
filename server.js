var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));


app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'static/index.html'));
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});




var players = {};
io.on('connection', function(socket) {
  socket.on('new player', function(x, y) {
    players[socket.id] = {
      x: Math.random()*x,
      y: Math.random()*y
    };
  });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });
  socket.on('disconnect', function() {
    delete players[socket.id];
  });
});
setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);

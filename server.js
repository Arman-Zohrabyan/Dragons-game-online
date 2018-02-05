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
  socket.on('new player', function(coordinate) {
    let coordinateX = parseInt(Math.random()*coordinate.x);
    let coordinateY = parseInt(Math.random()*coordinate.y);
    players[socket.id] = {
      x: coordinateX - coordinateX % 5,
      y: coordinateY - coordinateY % 5,
      maxBalls: 1,
      iSprDir: 0,
      iSprPos: 0,
      balls: []
    };
  });
  socket.on('movement', function(movement) {
    var player = players[socket.id] || {balls: []};
    player.iSprDir = movement.iSprDir;
    player.iSprPos = movement.iSprPos;

    movementPlayer(player, movement);

    if(movement.fire && player.balls.length < player.maxBalls) {
      player.balls.push({
        x: player.x + 32,
        y: player.y + 30,
        sprPos: movement.iSprDir
      });
    }

    if(player.balls.length > 0) {
      movementBalls(player, movement, socket.id);
    }
  });
  socket.on('disconnect', function() {
    delete players[socket.id];
  });
});

setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);




function movementPlayer(player, movement) {
  if (movement.left && player.x > 0-5) {
    player.x -= 5;
  }
  if (movement.up && player.y > 0-5) {
    player.y -= 5;
  }
  if (movement.right && player.x < 1000-75) {
    player.x += 5;
  }
  if (movement.down && player.y < 600-70) {
    player.y += 5;
  }
}


function movementBalls(player, movement, socketId) {
  var newBalls = [];
  player.balls.forEach(function (ball) {
    if(ball.sprPos === 0) {
      ball.x += movement.fireSpeed;
    } else if (ball.sprPos === 1) {
      ball.x += movement.fireSpeed;
      ball.y += movement.fireSpeed;
    } else if (ball.sprPos === 2) {
      ball.y += movement.fireSpeed;
    } else if (ball.sprPos === 3) {
      ball.x -= movement.fireSpeed;
      ball.y += movement.fireSpeed;
    } else if (ball.sprPos === 4) {
      ball.x -= movement.fireSpeed;
    } else if (ball.sprPos === 5) {
      ball.x -= movement.fireSpeed;
      ball.y -= movement.fireSpeed;
    } else if (ball.sprPos === 6) {
      ball.y -= movement.fireSpeed;
    } else if (ball.sprPos === 7) {
      ball.x += movement.fireSpeed;
      ball.y -= movement.fireSpeed;
    }

    Object.keys(players).forEach(function (playerId) {
      if(playerId !== socketId) {
        if(isIntersects(players[playerId], ball)) {
          delete players[playerId];
          ball.remove = true;
        }
      }
    });

    if(ball.x < 1030 && ball.x > -30 && ball.y > -30 && ball.y < 630 && !ball.remove) {
      newBalls.push(ball);
    }
  });

  player.balls = newBalls;
}


function isIntersects(a,b) {
  return(
    (
      (
        ( a.x>=b.x && a.x<=b.x+32 )||( (a.x+70)>=b.x && (a.x+70)<=b.x+32  )
      ) && (
        ( a.y>=b.y && a.y<=(b.y+32) )||( (a.y+75)>=b.y && (a.y+75)<=(b.y+32) )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=(a.x+70) )||( b.x+32>=a.x && b.x+32<=(a.x+70)  )
      ) && (
        ( b.y>=a.y && b.y<=(a.y+75) )||( (b.y+32)>=a.y && (b.y+32)<=(a.y+75) )
      )
    )
  )||(
    (
      (
        ( a.x>=b.x && a.x<=b.x+32 )||( (a.x+70)>=b.x && (a.x+70)<=b.x+32  )
      ) && (
        ( b.y>=a.y && b.y<=(a.y+75) )||( (b.y+32)>=a.y && (b.y+32)<=(a.y+75) )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=(a.x+70) )||( b.x+32>=a.x && b.x+32<=(a.x+70)  )
      ) && (
        ( a.y>=b.y && a.y<=(b.y+32) )||( (a.y+75)>=b.y && (a.y+75)<=(b.y+32) )
      )
    )
  );
}

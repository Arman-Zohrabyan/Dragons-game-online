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






var initialPlayer = {
  balls: [],
  dragonSpritePos: {}
};

var players = {};

io.on('connection', function(socket) {
  socket.on('new player', function(userData) {
    let coordinateX = parseInt(Math.random()*userData.x);
    let coordinateY = parseInt(Math.random()*userData.y);

    players[socket.id] = {
      balls: [],
      dragonSpritePos: {
        vertical: 0,
        horizontal: 0
      },
      x: coordinateX - coordinateX % 5,
      y: coordinateY - coordinateY % 5,
      dragonName: userData.dragonName,
      maxBalls: 1,
      health: 5,
    };
  });
  socket.on('actions', function(actions) {
    var { movement, spritePositions } = actions;
    var player = players[socket.id] || Object.assign({}, initialPlayer);

    player.dragonSpritePos.vertical = spritePositions.vertical;
    player.dragonSpritePos.horizontal = spritePositions.horizontal;

    movementPlayer(player, movement);

    if(actions.fire && player.balls.length < player.maxBalls) {
      player.balls.push({
        x: player.x + 32,
        y: player.y + 30,
        sprPos: spritePositions.vertical
      });
    }

    if(player.balls.length > 0) {
      movementBalls(player, actions, socket.id);
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


function movementBalls(player, actions, socketId) {
  var newBalls = [];
  player.balls.forEach(function (ball) {
    if(ball.sprPos === 0) {
      ball.x += actions.fireSpeed;
    } else if (ball.sprPos === 1) {
      ball.x += actions.fireSpeed;
      ball.y += actions.fireSpeed;
    } else if (ball.sprPos === 2) {
      ball.y += actions.fireSpeed;
    } else if (ball.sprPos === 3) {
      ball.x -= actions.fireSpeed;
      ball.y += actions.fireSpeed;
    } else if (ball.sprPos === 4) {
      ball.x -= actions.fireSpeed;
    } else if (ball.sprPos === 5) {
      ball.x -= actions.fireSpeed;
      ball.y -= actions.fireSpeed;
    } else if (ball.sprPos === 6) {
      ball.y -= actions.fireSpeed;
    } else if (ball.sprPos === 7) {
      ball.x += actions.fireSpeed;
      ball.y -= actions.fireSpeed;
    }

    if(ball.x < 1000 && ball.x > 0 && ball.y > 0 && ball.y < 600 && !ball.hitTheDragon) {
      newBalls.push(ball);
      
      // Проверяем шар попал в игрока или нет (удаляем шар во время следующего рендера)
      Object.keys(players).forEach(function (playerId) {
        if(playerId !== socketId) {
          if(isIntersects(players[playerId], ball)) {
            players[playerId].health--;
            ball.hitTheDragon = true;

            // Когда здоровье = 0, удаляем игрока.
            if(players[playerId].health === 0) {
              delete players[playerId];
            }
          }
        }
      });
    }
  });

  player.balls = newBalls;
}




function isIntersects(a,b) {
  return(
    (
      (
        ( a.x>=b.x && a.x<=b.x+16 )||( (a.x+70)>=b.x && (a.x+70)<=b.x+16  )
      ) && (
        ( a.y>=b.y && a.y<=(b.y+16) )||( (a.y+75)>=b.y && (a.y+75)<=(b.y+16) )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=(a.x+70) )||( b.x+16>=a.x && b.x+16<=(a.x+70)  )
      ) && (
        ( b.y>=a.y && b.y<=(a.y+75) )||( (b.y+16)>=a.y && (b.y+16)<=(a.y+75) )
      )
    )
  )||(
    (
      (
        ( a.x>=b.x && a.x<=b.x+16 )||( (a.x+70)>=b.x && (a.x+70)<=b.x+16  )
      ) && (
        ( b.y>=a.y && b.y<=(a.y+75) )||( (b.y+16)>=a.y && (b.y+16)<=(a.y+75) )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=(a.x+70) )||( b.x+16>=a.x && b.x+16<=(a.x+70)  )
      ) && (
        ( a.y>=b.y && a.y<=(b.y+16) )||( (a.y+75)>=b.y && (a.y+75)<=(b.y+16) )
      )
    )
  );
}

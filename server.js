var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var fs = require('fs');
var stream = fs.createWriteStream("ideas.txt");
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
  dragonSpritePos: {},
  capability: {}
};

var players = {};
var socketIdByUserId = {};

var SIZES = {
  field: {w: 900, h: 600},
  dragonCanvas: {w: 60, h: 56}, // ширина-высота дракона в канвасе
  ballCanvas: {w: 10, h: 10}, // ширина-высота шара в канвасе
  shieldRadius: 32,
  miniShieldRadius: 16,
  healthCircleRadius: 3,
};

io.on('connection', function(socket) {
  socket.on('new player', function(userData) {
    socketIdByUserId[userData.id] = socket.id;

    players[userData.id] = {
      dragonSpritePos: { // Позиции в спрайте
        vertical: 0,
        horizontal: 0
      },
      capability: { // меняющиеся навыки / колличество
        maxBalls: 1,
        shieldsCount: 1,
      },
      balls: [], // шары
      x: generateRandomNumber(userData.x-SIZES.dragonCanvas.w), //координата x дракона в поле
      y: generateRandomNumber(userData.y-SIZES.dragonCanvas.h), //координата y дракона в поле
      dragonName: userData.dragonName, // название дракона
      health: 5, // начальное здоровье
      fireSpeed: 8, // начальная скорость шара
      ownSpeed: 5, // скорость передвижения дракона
      enemiesKilled: 0, // колличество убитых врагов
      shield: false, // щит
      shieldCountDown: 0, // время до исчезновения щита
    };
  });

  socket.on('actions', function(actions) {
    var { movement, spritePositions, capability, playerId } = actions;
    var player = players[playerId] || Object.assign({}, initialPlayer);

    player.dragonSpritePos.vertical = spritePositions.vertical;
    player.dragonSpritePos.horizontal = spritePositions.horizontal;

    // Передвижение дракона
    movementPlayer(player, movement);

    // Изменение названия дракона
    if(actions.setNewNameForDragon) {
      player.dragonName = actions.setNewNameForDragon;
    }

    // Запускаем шар (если максимальное колличество шаров не было уже запущено).
    // TODO: проблема с проверкой, надо проверить capability && 
    if(capability && capability.fire && player.balls.length < player.capability.maxBalls) {
      player.balls.push({
        x: player.x + Math.floor(SIZES.dragonCanvas.w/2-SIZES.ballCanvas.w/2),
        y: player.y + Math.floor(SIZES.dragonCanvas.h/2-SIZES.ballCanvas.h/2),
        sprPos: spritePositions.vertical
      });
    }

    // Передвижение шаров.
    if(player.balls.length > 0) {
      movementBalls(player, playerId);
    }

    // Если есть в складе запасной щит и щит не включен, активизируем щит.
    // TODO: проблема с проверкой, надо проверить capability && 
    if(capability && capability.shield && !player.shield && player.capability.shieldsCount > 0) {
      activateShield(player);
    }
  });

  socket.on('new idea', function(dragonName, idea) {
    stream.write(JSON.stringify({[dragonName]: idea}) + "\n");
  });

  socket.on('disconnect', function() {
    delete players[objectKeyByValue(socketIdByUserId, socket.id)];
  });
});

setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);




// Движение игрока
function movementPlayer(player, movement) {
  if (movement.left && player.x > 0) {
    player.x -= player.ownSpeed;
  }
  if (movement.up && player.y > 0) {
    player.y -= player.ownSpeed;
  }
  if (movement.right && player.x < SIZES.field.w-SIZES.dragonCanvas.w) {
    player.x += player.ownSpeed;
  }
  if (movement.down && player.y < SIZES.field.h-SIZES.dragonCanvas.h) {
    player.y += player.ownSpeed;
  }
}

// Движение шара.
function movementBalls(player, userId) {
  var newBalls = [];
  player.balls.forEach(function (ball) {
    if(ball.sprPos === 0) {
      ball.x += player.fireSpeed;
    } else if (ball.sprPos === 1) {
      ball.x += player.fireSpeed;
      ball.y += player.fireSpeed;
    } else if (ball.sprPos === 2) {
      ball.y += player.fireSpeed;
    } else if (ball.sprPos === 3) {
      ball.x -= player.fireSpeed;
      ball.y += player.fireSpeed;
    } else if (ball.sprPos === 4) {
      ball.x -= player.fireSpeed;
    } else if (ball.sprPos === 5) {
      ball.x -= player.fireSpeed;
      ball.y -= player.fireSpeed;
    } else if (ball.sprPos === 6) {
      ball.y -= player.fireSpeed;
    } else if (ball.sprPos === 7) {
      ball.x += player.fireSpeed;
      ball.y -= player.fireSpeed;
    }

    if(ball.x < SIZES.field.w && ball.x > 0 && ball.y > 0 && ball.y < SIZES.field.h && !ball.hitTheDragon) {
      newBalls.push(ball);

      // Проверяем шар попал в игрока или нет (удаляем шар во время следующего рендера)
      Object.keys(players).forEach(function (playerId) {
        if(playerId !== userId) {
          // Проверяем пересекается шар с драконом.
          if(isIntersects(
                players[playerId],
                {x: players[playerId].x+SIZES.dragonCanvas.w,y: players[playerId].y+SIZES.dragonCanvas.h},
                ball,
                {x: (ball.x+SIZES.ballCanvas.h), y: (ball.y+SIZES.ballCanvas.h)}
            )) {

            ball.hitTheDragon = true;

            // Если у игрока не ставлен щит, отнимает единицу здоровья
            if(!players[playerId].shield) {
              players[playerId].health--;
            }

            // Когда здоровье = 0, удаляем игрока. Даем бафы владельцу шара.
            if(players[playerId].health === 0) {
              player.enemiesKilled++;

              // Добавляем к владельцу шара здоровье +1
              if(player.health < 10) {
                player.health++;
              }

              // Добавляем к владельцу шара скоровть атаки шара +2
              if(player.fireSpeed < 38) {                
                player.fireSpeed+=2;
              }

              delete players[playerId];
            }
          }
        }
      });
    }
  });

  player.balls = newBalls;
}

// активация щита
function activateShield(player) {
  player.capability.shieldsCount--;
  player.shieldCountDown = 6;
  player.shield = true;
  countDown(player, {capability: "shield", countDown: "shieldCountDown"});
}


// кулдаун скилов
function countDown(player, options) {
  setTimeout(function () {
    if(player[options.countDown] !== 1) {
      player[options.countDown]--;
      countDown(player, options);
    } else {
      player[options.capability] = false;
    }
  }, 1000);
}


// Проверяет пересекаются ли прямоугольника
// первый аргумент:    координаты левого верхнего угла первого прямоугольника
// второй аргумент:    координаты правого нижнего угла первого прямоугольника
// третий аргумент:    координаты левого верхнего угла второго прямоугольника
// четвертый аргумент: координаты правого нижнего угла первого прямоугольника
function isIntersects(a, a1, b, b1) {
  return(
    (
      (
        ( a.x>=b.x && a.x<=b1.x )||( a1.x>=b.x && a1.x<=b1.x  )
      ) && (
        ( a.y>=b.y && a.y<=b1.y )||( a1.y>=b.y && a1.y<=b1.y )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=a1.x )||( b1.x>=a.x && b1.x<=a1.x  )
      ) && (
        ( b.y>=a.y && b.y<=a1.y )||( b1.y>=a.y && b1.y<=a1.y )
      )
    )
  )||(
    (
      (
        ( a.x>=b.x && a.x<=b1.x )||( a1.x>=b.x && a1.x<=b1.x  )
      ) && (
        ( b.y>=a.y && b.y<=a1.y )||( b1.y>=a.y && b1.y<=a1.y )
      )
    )||(
      (
        ( b.x>=a.x && b.x<=a1.x )||( b1.x>=a.x && b1.x<=a1.x  )
      ) && (
        ( a.y>=b.y && a.y<=b1.y )||( a1.y>=b.y && a1.y<=b1.y )
      )
    )
  );
}


// Генерирует рандомное число в интервале от 0 до distance, которое делится на 5.
function generateRandomNumber(distance) {
  var random = Math.random();
  return random*distance - random*distance%5;
}

// Получить ключь объекта по значению.
function objectKeyByValue(obj, value) {
  return Object.keys(obj)[Object.values(obj).indexOf(value)];
}
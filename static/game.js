var documentInnerHeight = $(document).height();

var canvas, ctx = null;

var dragonW = 75; // ширина дракона
var dragonH = 70; // высота дракона

var ballW = 32; // ширина шара
var ballH = 32; // высота шара
var ballCanvasW = 16; // будет нарисован шара с шириной 
var ballCanvasH = 16; // будет нарисован шара с высотой 
var iBallSpeed = 10; // скорость шаров

var movement = {
  up: false,
  down: false,
  left: false,
  right: false,
  iSprDir: 0,
  iSprPos: 0,
  fire: false,
  fireSpeed: iBallSpeed
};



// Подкулючаем веб-сокет.
var socket = io();



// Инициализация фото дракона.
var oDragonImage = new Image();
oDragonImage.src = '/static/images/dragon.gif';
oDragonImage.onload = function() {};

var oBallImage = new Image();
oBallImage.src = '/static/images/fireball.png';
oBallImage.onload = function() {};



function getSprPosition() {
  if(movement.up && movement.right) {
    return 7;
  } else if(movement.down && movement.right) {
    return 1;
  } else if(movement.down && movement.left) {
    return 3;
  } else if(movement.up && movement.left) {
    return 5;
  } else if(movement.right) {
    return 0;
  } else if(movement.up) {
    return 6;
  } else if(movement.left) {
    return 4;
  } else if(movement.down) {
    return 2;
  }
  return movement.iSprDir;
}

//обработчик событий
function hendlerEvents() {
  $(document).on('keydown', function(event) {
    var code = event.keyCode;
    if(code === 37 || code === 65) {         // left || A
      movement.left = true;
      movement.iSprDir = getSprPosition();
    } else if (code === 38 || code === 87) { // up || W
      movement.up = true;
      movement.iSprDir = getSprPosition();
    } else if (code === 39 || code === 68) { // right || D
      movement.right = true;
      movement.iSprDir = getSprPosition();
    } else if (code === 40 || code === 83) { // down || S
      movement.down = true;
      movement.iSprDir = getSprPosition();
    }
  });
  $(document).on('keyup', function(event) {
    var code = event.keyCode;
    if(code === 37 || code === 65) {         // left || A
      movement.left = false;
      movement.iSprDir = getSprPosition();
    } else if (code === 38 || code === 87) { // up || W
      movement.up = false;
      movement.iSprDir = getSprPosition();
    } else if (code === 39 || code === 68) { // right || D
      movement.right = false;
      movement.iSprDir = getSprPosition();
    } else if (code === 40 || code === 83) { // down || S
      movement.down = false;
      movement.iSprDir = getSprPosition();
    } else if (code === 74) {                // 74 = J, 75=K, 76=L
      movement.fire = true;
    }
  });
}

// Обработчик движения игрока
function handlerOfPlayerMovement() {
  setInterval(function() {
    if (movement.iSprPos === 9) {
      movement.iSprPos = 0;
    } else {
      movement.iSprPos = movement.iSprPos+1;
    }
    socket.emit('movement', movement);
    movement.fire = false;
  }, 1000 / 60);
}


// Отрисовка игры.
function drawGame() {
  socket.on('state', function(players) {
    ctx.clearRect(0, 0, 1000, 600);
    ctx.fillStyle = 'green';
    for (var id in players) {
      var player = players[id];
      if(!player.hide) {

        // отрисовка дракона
        ctx.drawImage(
          oDragonImage,
          player.iSprPos*dragonW,
          player.iSprDir*dragonH,
          dragonW,
          dragonH,
          player.x,
          player.y,
          dragonW,
          dragonH
        );

        // отрисовка шаров
        if (player.balls.length > 0) {
          for (var key = 0; key < player.balls.length; key++) {
            ctx.drawImage(
              oBallImage,
              player.balls[key].sprPos*ballW,
              0,
              ballW,
              ballH,
              player.balls[key].x,
              player.balls[key].y,
              ballCanvasW,
              ballCanvasH
            );
          }
        }
      }
    }
  });
}


// Инициализация
$(document).ready(function () {
  // Задаем респонзивно ширину и высоту канваса.
  $("#canvas").height(documentInnerHeight);
  $("#canvas").width(documentInnerHeight*5/3);

  // Общие переменные и настройки канваса.
  canvas = $("#canvas")[0];
  ctx = canvas.getContext('2d');
  canvas.width = 1000;
  canvas.height = 600;

  // Добавляем нового игрока.
  socket.emit('new player', {x: 1000, y: 600});

  // обработчик событий
  hendlerEvents();

  // Добавляем обработчик движения игрока
  handlerOfPlayerMovement();

  // Отрисовываем игру
  drawGame();
});

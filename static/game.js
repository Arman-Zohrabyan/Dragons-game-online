// Ввод названия Дракона.
var dragonName = '', playerId = '';
var dragonGameData = JSON.parse(localStorage.getItem("data"));

if(dragonGameData === null) {
  playerId = guidGenerator();
  dragonName = prompt(window.STRINGS["promptWelcome"]) || "Undefined Dragon";

  localStorage.setItem("data", JSON.stringify({playerId: playerId, dragonName: dragonName}));
} else {
  dragonName = dragonGameData.dragonName;
  playerId = dragonGameData.playerId;
}

// Временная подсказка.
var hint = window.STRINGS["hint1"];

setTimeout( function() {
  hint = window.STRINGS["hint2"];
  setTimeout(function() {
    hint = window.STRINGS["hint3"];
    setTimeout( function() {
      hint = window.STRINGS["hint4"];
    }, 10000);
  }, 10000);
}, 10000);

// внутренняя высота экрана.
var documentInnerHeight = $(document).height();

// Подкулючаем веб-сокет.
var socket = io();

// глобальные переменные для канваса.
var canvas, ctx = null;

var dragonW = 75; // ширина дракона
var dragonH = 70; // высота дракона
var ballW = 32; // ширина шара в спрайте
var ballH = 32; // высота шара в спрайте
var ballCanvasW = 16; // будет нарисован шар с шириной 
var ballCanvasH = 16; // будет нарисован шар с высотой 
var iBallSpeed = 8; // скорость шаров


// Действия игрока
var actions = {
  playerId: playerId,

  movement: {
    up: false,
    down: false,
    left: false,
    right: false
  },
  spritePositions: {
    vertical: 0,
    horizontal: 0
  },
  supportive: {
    fire: false,
    shield: false
  },
  setNewNameForDragon: '',
};


// Инициализация картинку дракона.
var oDragonImage = new Image();
oDragonImage.src = '/static/images/dragon.gif';
oDragonImage.onload = function() {};

// Инициализация картинку огня.
var oBallImage = new Image();
oBallImage.src = '/static/images/fireball.png';
oBallImage.onload = function() {};

// Инициализвция картинку заднего фона.
backgroundImage = new Image();
backgroundImage.src = '/static/images/background.jpg';
backgroundImage.onload = function() {};


// Функция определяет вертикальную позицию для спрайта дракона.
function getSpriteVerticalPosition() {
  var movement = actions.movement;
  var spritePositions = actions.spritePositions;

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
  return spritePositions.vertical;
}

// Обработчики событий.
function hendlerEvents() {
  $(document).on('keydown', function(event) {
    var code = event.keyCode;
    if(code === 37 || code === 65) {         // left || A
      actions.movement.left = true;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 38 || code === 87) { // up || W
      actions.movement.up = true;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 39 || code === 68) { // right || D
      actions.movement.right = true;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 40 || code === 83) { // down || S
      actions.movement.down = true;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    }
  });

  $(document).on('keyup', function(event) {
    var code = event.keyCode;
    if(code === 37 || code === 65) {         // left || A
      actions.movement.left = false;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 38 || code === 87) { // up || W
      actions.movement.up = false;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 39 || code === 68) { // right || D
      actions.movement.right = false;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 40 || code === 83) { // down || S
      actions.movement.down = false;
      actions.spritePositions.vertical = getSpriteVerticalPosition();
    } else if (code === 74) {                // 74 = J
      actions.supportive.fire = true;
    } else if (code === 75) {                // 75=K, 76=L
      actions.supportive.shield = true;
    } else if (code === 80) {                // 80=P
      actions.setNewNameForDragon = prompt(window.STRINGS["promptChangeDragonName"]) || "Undefined Dragon";
      dragonName = actions.setNewNameForDragon;
      localStorage.setItem("data", JSON.stringify({playerId: playerId, dragonName: dragonName}));
    } else if (code === 73) {                // 73=I
      var idea = prompt("Ваша идея?");
      if(idea) {
        socket.emit("new idea", dragonName, idea);
      }
    } else if (code === 82) {                // 82=R
      socket.emit('new player', {x: 1000, y: 600, dragonName: dragonName, id: playerId});
    }
  });
}




// Обработчик движения игрока.
function handlerOfPlayerActions() {
  setInterval(function() {
    if (actions.spritePositions.horizontal === 9) {
      actions.spritePositions.horizontal = 0;
    } else {
      actions.spritePositions.horizontal++;
    }
    socket.emit('actions', actions);

    actions.supportive.fire = false;
    actions.supportive.shield = false;

  }, 1000 / 60);
}

// Отрисовка игры.
function drawGame() {
  socket.on('state', function(players) {
    var currentPlayer = {};
    ctx.clearRect(0, 0, 1100, 600);
    ctx.textAlign = "center";

    // Задний фон.
    ctx.drawImage(backgroundImage, 0, 0, 1000, 600);

    for (var id in players) {
      var player = players[id];

      // Отрисовка дракона.
      ctx.drawImage(
        oDragonImage,
        player.dragonSpritePos.horizontal*dragonW,
        player.dragonSpritePos.vertical*dragonH,
        dragonW,
        dragonH,
        player.x,
        player.y,
        dragonW,
        dragonH
      );

      if(player.shield) {
        player.dragonName = player.shieldCountDown + " " + player.dragonName;
        // отрисовка щита дракона
        ctx.strokeStyle = "rgba(0, 128, 255, 0.5)";
        ctx.fillStyle = "rgba(0, 128, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(player.x+38, player.y+35, 40, 0, Math.PI*2, false);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.stroke();
      }


      ctx.font = '12px Verdana';
      ctx.fillStyle = '#FF8C00';
      if(id === playerId) {
        currentPlayer = player;
        ctx.font = '14px Verdana';
        ctx.fillStyle = '#7FFF00';
      }

      // Название дракона + Колличество убитых врагов.
      var enemiesKilled = player.enemiesKilled ? (" +" + player.enemiesKilled) : '';
      ctx.fillText(player.dragonName + enemiesKilled, player.x+38, player.y-8);


      // Отрисовка шаров.
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

      // Рисовка здоровья дракона. Круги.
      if (player.health === 4) {
        ctx.fillStyle = '#228B22';
        ctx.strokeStyle = '#228B22';
      } else if (player.health === 3) {
        ctx.fillStyle = '#FF8C00';
        ctx.strokeStyle = '#FF8C00';
      } else if (player.health === 2) {
        ctx.fillStyle = '#A0522D';
        ctx.strokeStyle = '#A0522D';
      } else if (player.health === 1) {
        ctx.fillStyle = '#DC143C';
        ctx.strokeStyle = '#DC143C';
      } else {
        ctx.fillStyle = '#7FFF00';
        ctx.strokeStyle = '#7FFF00';
      }
      var i = 0;
      ctx.beginPath();
      for(var i = 0; i < player.health; i++) {
        ctx.arc(player.x+i*20, player.y, 4, 0, Math.PI*2, false);
        ctx.fill();
      }
      ctx.closePath();
      // Рисовка здоровья дракона. Окружности.
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      for(i; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(player.x+i*20, player.y, 4, 0, Math.PI*2, false);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Правое меню.
    ctx.fillStyle = '#BDB76B';
    ctx.fillRect(1000, 0, 100, 600);

    // Текст правого меню.
    ctx.font = '18px Verdana';
    ctx.fillStyle = '#191970';
    ctx.fillText("Склад", 1050, 20);

    // отрисовка щита дракона
    ctx.strokeStyle = "rgba(0, 128, 255, 0.5)";
    ctx.fillStyle = "rgba(0, 128, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(1030, 50, 16, 0, Math.PI*2, false);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    if(currentPlayer.supportive) {
      // Текст правого меню.
      ctx.font = '14px Verdana';
      ctx.fillStyle = '#191970';
      ctx.fillText("-   " + currentPlayer.supportive.shieldsCount, 1070, 55);
    }

    // Подсказка.
    ctx.font = '16px Verdana';
    ctx.textAlign = "start";
    ctx.fillStyle = '#FFF';
    ctx.fillText(hint, 5, 595);
  });
}


// Инициализация
$(document).ready(function () {
  // Задаем респонзивно ширину и высоту канваса.
  $("#canvas").height(documentInnerHeight);
  $("#canvas").width(documentInnerHeight*11/6);

  // Общие переменные и настройки канваса.
  canvas = $("#canvas")[0];
  ctx = canvas.getContext('2d');
  canvas.width = 1100;
  canvas.height = 600;

  // Добавляем нового игрока.
  socket.emit('new player', {x: 1000, y: 600, dragonName: dragonName, id: playerId});

  // Добавляем обработчик событий.
  hendlerEvents();

  // Добавляем обработчик движения игрока.
  handlerOfPlayerActions();

  // Рисовка игры.
  drawGame();
});













// Функция генерирует случайный playerId в виде xxxx-xxxx-xxxx-xxxx-xxxx
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4());
}

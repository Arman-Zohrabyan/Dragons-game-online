var SIZES = {
  documentInner: {w: $(document).width(), h: $(document).height()}, // внутренняя ширина-высота экрана.
  canvas: {w: 1100, h: 600},
  field: {w: 900, h: 600},
  menu: {w: 200, h: 600},
  dragon: {w: 75, h: 70}, // ширина-высота дракона в спрайте
  dragonCanvas: {w: 60, h: 56}, // ширина-высота дракона в канвасе
  ball: {w: 32, h: 32}, // ширина-высота шара в спрайте
  ballCanvas: {w: 10, h: 10}, // ширина-высота шара в канвасе
  shieldRadius: 32,
  miniShieldRadius: 16,
  healthCircleRadius: 3,
};

// Ввод названия Дракона, сгенерирование playerId.
var dragonName = '', playerId = '';
var dragonGameData = JSON.parse(localStorage.getItem("data"));
if(dragonGameData === null) {
  playerId = guidGenerator();
  dragonName = prompt(STRINGS["promptWelcome"]) || "Undefined Dragon";
  localStorage.setItem("data", JSON.stringify({playerId: playerId, dragonName: dragonName}));
} else {
  dragonName = dragonGameData.dragonName;
  playerId = dragonGameData.playerId;
}

var currentPlayer = {};

// Временная подсказка.
var hint = STRINGS["hint1"];

setTimeout( function() {
  hint = STRINGS["hint2"];
  setTimeout(function() {
    hint = STRINGS["hint3"];
    setTimeout( function() {
      hint = STRINGS["hint4"];
    }, 10000);
  }, 10000);
}, 15000);

// Подкулючаем веб-сокет.
var socket = io();

// глобальные переменные для канваса.
var canvas, ctx = null;

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
  spriteShield: {
    horizontal: 0
  },
  capability: {
    fire: false,
    shield: false,
    multiplyFire: false,
  },
  setNewNameForDragon: '',
};


// Инициализация картинки дракона.
var dragonImage = new Image();
dragonImage.src = '/static/images/dragon.gif';

// Инициализация картинки огня.
var ballImage = new Image();
ballImage.src = '/static/images/fireball.png';

// Инициализвция картинки заднего фона.
var backgroundImage = new Image();
backgroundImage.src = '/static/images/background.jpg';

// Инициализвция картинки щита.
var shieldImage = new Image();
shieldImage.src = '/static/images/shield.png';

// Инициализвция картинки x2.
var multiplyFireImage = new Image();
multiplyFireImage.src = '/static/images/2fire.png';


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
      actions.capability.fire = true;
    } else if (code === 75) {                // 75=K
      actions.capability.shield = true;
    } else if (code === 76) {                // 76=L
      actions.capability.multiplyFire = true;
    } else if (code === 80) {                // 80=P
      actions.setNewNameForDragon = prompt(STRINGS["promptChangeDragonName"]) || "Undefined Dragon";
      if(actions.setNewNameForDragon.length > 16) {
        actions.setNewNameForDragon = actions.setNewNameForDragon.substr(0,16);
      }
      dragonName = actions.setNewNameForDragon;
      localStorage.setItem("data", JSON.stringify({playerId: playerId, dragonName: dragonName}));
    } else if (code === 73) {                // 73=I
      var idea = prompt("Ваша идея?");
      if(idea) {
        socket.emit("new idea", dragonName, idea);
      }
    } else if (code === 82) {                // 82=R
      if($.isEmptyObject(currentPlayer)) {
        socket.emit('new player', {x: SIZES.field.w, y: SIZES.field.h, dragonName: dragonName, id: playerId});
      }
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

    actions.capability.fire = false;
    actions.capability.shield = false;
    actions.capability.multiplyFire = false;

  }, 1000 / 60);
}

// Отрисовка игры.
function drawGame() {
  socket.on('state', function(players, bonuses) {
    currentPlayer = {};
    ctx.clearRect(0, 0, SIZES.canvas.w, SIZES.canvas.h);


    // Задний фон.
    ctx.drawImage(backgroundImage, 0, 0, SIZES.field.w, SIZES.field.h);

    if(bonuses.shield) {
      ctx.strokeStyle = "#1E90FF";
      ctx.fillStyle = "#AFEEEE";
      ctx.beginPath();
      ctx.shadowBlur=20;
      ctx.shadowColor="black";

      ctx.arc(
        bonuses.shield.x,
        bonuses.shield.y,
        10,
        0,
        Math.PI*2,
        false
      );

      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke(); 
    }

    ctx.shadowBlur=0;
    ctx.textAlign = "center";

    for (var id in players) {
      var player = players[id];

      // Отрисовка дракона.
      ctx.drawImage(
        dragonImage,
        player.dragonSpritePos.horizontal*SIZES.dragon.w,
        player.dragonSpritePos.vertical*SIZES.dragon.h,
        SIZES.dragon.w,
        SIZES.dragon.h,
        player.x,
        player.y,
        SIZES.dragonCanvas.w,
        SIZES.dragonCanvas.h
      );

      if(player.shield) {
        player.dragonName = "щит: " + player.shieldCountDown + " / " + player.dragonName;

        ctx.drawImage(
          shieldImage,
          Math.floor(player.shieldSprite.horizontal/2)*75,
          0,
          75,
          75,
          player.x-5,
          player.y-5,
          75,
          70
        );
      }

      if(player.multiplyFire) {
        player.dragonName = "x2: " + player.multiplyFireCountDown + " / " + player.dragonName;

        // ctx.drawImage(
        //   shieldImage,
        //   Math.floor(player.shieldSprite.horizontal/2)*75,
        //   0,
        //   75,
        //   75,
        //   player.x-5,
        //   player.y-5,
        //   75,
        //   70
        // );
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
      ctx.fillText(
        player.dragonName + enemiesKilled,
        player.x+Math.ceil(SIZES.dragonCanvas.w/2)+2,
        player.y-8
      );


      // Отрисовка шаров.
      for (var key = 0; key < player.balls.length; key++) {
        ctx.drawImage(
          ballImage,
          player.balls[key].sprPos*SIZES.ball.w,
          0,
          SIZES.ball.w,
          SIZES.ball.h,
          player.balls[key].x,
          player.balls[key].y,
          SIZES.ballCanvas.h,
          SIZES.ballCanvas.h
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
        ctx.arc(
          player.x+i*Math.floor((SIZES.dragonCanvas.w+8*SIZES.healthCircleRadius)/5),
          player.y,
          SIZES.healthCircleRadius,
          0,
          Math.PI*2,
          false
        );
        ctx.fill();
      }
      ctx.closePath();
      // Рисовка здоровья дракона. Окружности.
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      for(i; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
          player.x+i*Math.floor((SIZES.dragonCanvas.w+8*SIZES.healthCircleRadius)/5),
          player.y,
          SIZES.healthCircleRadius,
          0,
          Math.PI*2,
          false
        );
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if($.isEmptyObject(currentPlayer)) {
      // Подсказка если игрока нет.
      ctx.font = '30px Verdana';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(STRINGS["hintForTheDeads"], SIZES.field.w/2, SIZES.field.h/2);
    }


    // Правое меню.
    ctx.fillStyle = '#BDB76B';
    ctx.fillRect(SIZES.field.w, 0, SIZES.menu.w, SIZES.menu.h);

    // Текст правого меню.
    ctx.font = '25px Verdana';
    ctx.fillStyle = '#191970';
    ctx.fillText("Склад", SIZES.canvas.w-SIZES.menu.w/2, 20);
    ctx.fillText("Управление", SIZES.canvas.w-SIZES.menu.w/2, 110);

    // Отрисовка щита дракона в правом меню.
    ctx.strokeStyle = "rgba(0, 128, 255, 0.5)";
    ctx.fillStyle = "rgba(0, 128, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(
      SIZES.field.w + 30,
      50,
      SIZES.miniShieldRadius,
      0,
      Math.PI*2,
      false
    );
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    // Отрисовка x2 в правом меню.
    ctx.drawImage(
      multiplyFireImage,
      SIZES.field.w + 100,
      34,
      35,
      35
    );

    // Текст правого меню.
    if(currentPlayer.capability) {
      // Колличество щитов
      ctx.font = '16px Verdana';
      ctx.fillStyle = '#191970';
      ctx.fillText("- " + currentPlayer.capability.shieldsCount, SIZES.field.w + 60, 55);
      // Колличество x2
      ctx.fillText("- " + currentPlayer.capability.multiplyFiresCount, SIZES.field.w + 150, 55);

    }
    // Управление
    ctx.font = '12px Verdana';
    ctx.fillText("Передвижеие: A, S, D, W", SIZES.canvas.w-SIZES.menu.w/2, 130);
    ctx.fillText("Изменить название дракона: P", SIZES.canvas.w-SIZES.menu.w/2, 166);
    ctx.font = '15px Verdana';
    ctx.fillText("Атака: J . Щит: K", SIZES.canvas.w-SIZES.menu.w/2, 148);
    ctx.fillText("Колличество шаров x2: L", SIZES.canvas.w-SIZES.menu.w/2, 184);
    ctx.fillText("Перерождение: R", SIZES.canvas.w-SIZES.menu.w/2, 200);

    // Здесь будет чат
    ctx.font = '25px Verdana';
    ctx.fillText("ЗДЕСЬ", SIZES.canvas.w-SIZES.menu.w/2, SIZES.menu.h-90);
    ctx.fillText("БУДЕТ", SIZES.canvas.w-SIZES.menu.w/2, SIZES.menu.h-60);
    ctx.fillText("ЧАТ", SIZES.canvas.w-SIZES.menu.w/2, SIZES.menu.h-30);

    // Подсказка.
    ctx.font = '19px Verdana';
    ctx.fillStyle = '#FFF';
    ctx.fillText("Добавлен новый навык 'Колличество шаров x2', что бы использовать нажмите: L", SIZES.field.w/2, 20);
    ctx.textAlign = "start";
    ctx.font = '16px Verdana';
    ctx.fillText(hint, 5, 595);
  });
}


// Инициализация
$(document).ready(function () {
  // Задаем респонзивно ширину и высоту канваса.
  $("#canvas").height(SIZES.documentInner.h);
  $("#canvas").width((SIZES.documentInner.h*11/6 > SIZES.documentInner.w) ? SIZES.documentInner.w : SIZES.documentInner.h*11/6);

  // Общие переменные и настройки канваса.
  canvas = $("#canvas")[0];
  ctx = canvas.getContext('2d');
  canvas.width = SIZES.canvas.w;
  canvas.height = SIZES.canvas.h;

  // Добавляем нового игрока.
  socket.emit('new player', {x: SIZES.field.w, y: SIZES.field.h, dragonName: dragonName, id: playerId});

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

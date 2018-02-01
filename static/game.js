var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}
document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 37: // left
    case 65: // A
      movement.left = true;
      break;
    case 38: // up
    case 87: // W
      movement.up = true;
      break;
    case 39: // right
    case 68: // D
      movement.right = true;
      break;
    case 40: // down
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 37: // left
    case 65: // A
      movement.left = false;
      break;
    case 38: // up
    case 87: // W
      movement.up = false;
      break;
    case 39: // right
    case 68: // D
      movement.right = false;
      break;
    case 40: // down
    case 83: // S
      movement.down = false;
      break;
  }
});





const CONSTANTS = {
  canvas: {
    width: 800,
    height: 600
  }
};
const ELEMENTS = {
  canvas: document.getElementById('canvas'),
  context: document.getElementById('canvas').getContext('2d')
};



class CanvasPainter {
  static clearBoard() {
    ELEMENTS.context.clearRect(0, 0, CONSTANTS.canvas.width, CONSTANTS.canvas.height);
  }

  static paintPlayers(players) {
    ELEMENTS.context.fillStyle = 'green';
    for (var id in players) {
      var player = players[id];
      ELEMENTS.context.beginPath();
      ELEMENTS.context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
      ELEMENTS.context.fill();
    }
  }
}




class Game {
  constructor() {
    this.socket = io();

    ELEMENTS.canvas.width = CONSTANTS.canvas.width;
    ELEMENTS.canvas.height = CONSTANTS.canvas.height;
    this.socketNewPlayer();
    this.socketState();
  }

  socketState() {
    this.socket.on('state', (players) => {
      CanvasPainter.clearBoard();
      CanvasPainter.paintPlayers(players);
    });
  }

  socketNewPlayer() {
    this.socket.emit('new player', CONSTANTS.canvas.width, CONSTANTS.canvas.height);
    setInterval(() => {
      this.socket.emit('movement', movement);
    }, 1000 / 60);
  }
}

new Game();
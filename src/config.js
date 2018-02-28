export const KEY = {
  LEFT:  37,
  A: 65,
  RIGHT: 39,
  D: 68,
  UP: 38,
  W: 87,
  DOWN: 40,
  S: 83,
  J: 74,
  K: 75,
  L: 76,
  P: 80,
  I: 73,
  R: 82,
};


export const SIZES = {
  // documentInner: {w: $(document).width(), h: $(document).height()}, // внутренняя ширина-высота экрана.
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

export const IMAGES = {
  dragon: (() => {
    // Инициализация картинки дракона.
    var dragonImage = new Image();
    dragonImage.src = '/static/images/dragon.gif';
    return dragonImage;
  })()
};
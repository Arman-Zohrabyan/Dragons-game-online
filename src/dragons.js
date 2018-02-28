import React, { Component, Fragment } from 'react';
import { socketConnect } from 'socket.io-react';

import _ from 'lodash';
import { KEY, SIZES, IMAGES } from './config.js';
import { guidGenerator } from './helper.js';


class Dragons extends Component {
  constructor(props) {
    super(props);

    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.actions = {
      socketId: props.socket.id,
      playerId: guidGenerator(),
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
      setNewNameForDragon: null,
    };

    // Добавляем нового игрока.
    props.socket.emit('new player', {x: SIZES.field.w, y: SIZES.field.h, dragonName: "dragonName", id: this.actions.playerId});
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));

    this.updateGet();
    requestAnimationFrame(() => {this.updateSend()});
  }

  componentWillMount() {
  }

  handleKeys(value, e) {
    const movement = this.actions.movement;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) movement.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) movement.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) movement.up    = value;
    if(e.keyCode === KEY.DOWN   || e.keyCode === KEY.S) movement.down  = value;
  }

  updateGet() {
    const ctx = this.refs.canvas.getContext('2d');
    this.props.socket.on('state', function(players, bonuses) {
      ctx.clearRect(0, 0, SIZES.canvas.w, SIZES.canvas.h);

      _.each(players, (player, playerId) => {


        ctx.drawImage(
          IMAGES.dragon,
          player.dragonSpritePos.horizontal*SIZES.dragon.w,
          player.dragonSpritePos.vertical*SIZES.dragon.h,
          SIZES.dragon.w,
          SIZES.dragon.h,
          player.x,
          player.y,
          SIZES.dragonCanvas.w,
          SIZES.dragonCanvas.h
        );


      });
    });
  }

  updateSend() {
    if (this.actions.spritePositions.horizontal === 9) {
      this.actions.spritePositions.horizontal = 0;
    } else {
      this.actions.spritePositions.horizontal++;
    }
    this.props.socket.emit('actions', this.actions);

    requestAnimationFrame(() => {this.updateSend()});
  }

  render() {
    return (
      <Fragment>
        <canvas ref="canvas"
          width={SIZES.canvas.w}
          height={SIZES.canvas.h}
        />
      </Fragment>
    );
  }
}


export default socketConnect(Dragons);

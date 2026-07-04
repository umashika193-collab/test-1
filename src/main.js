import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import Title from './scenes/Title';
import Game from './scenes/Game';

const config = {
  type: Phaser.AUTO,
  width: 320, 
  height: 480,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [Preloader, Title, Game]
};

export default new Phaser.Game(config);

import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Load assets with cache buster to ensure new transparent images are loaded
    const v = '?v=' + Date.now();
    this.load.image('player', '/assets/player.png' + v);
    this.load.image('enemy', '/assets/enemy.png' + v);
    this.load.image('powerup', '/assets/powerup.png' + v);
    this.load.image('funnel', '/assets/funnel.png' + v);
    this.load.image('boss', '/assets/boss.png' + v);
    this.load.image('title_bg', '/assets/title_bg.png' + v);
    this.load.image('bg', '/assets/bg.png' + v);
    
    const text = this.add.text(160, 240, 'LOADING...', { font: '24px Arial', fill: '#ffffff' });
    text.setOrigin(0.5, 0.5);
  }

  create() {
    this.scene.start('Title');
  }
}

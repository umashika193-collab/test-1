import Phaser from 'phaser';

export default class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // Add renaissance boss background
    const bg = this.add.image(160, 240, 'title_bg');
    bg.setOrigin(0.5, 0.5);
    
    // Scale bg to cover the screen (320x480)
    const scaleX = 320 / bg.width;
    const scaleY = 480 / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));
    
    // Add dark overlay for readability
    this.add.rectangle(160, 240, 320, 480, 0x000000, 0.4);

    // Title Text: "御成敗式目"
    const titleText = this.add.text(160, 160, '御成敗式目', {
      fontFamily: 'serif',
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    });
    titleText.setOrigin(0.5, 0.5);

    // Tap to Start Text
    const startText = this.add.text(160, 380, '- TAP TO START -', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    startText.setOrigin(0.5, 0.5);

    // Blinking animation
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      ease: 'Stepped',
      easeParams: [1],
      yoyo: true,
      repeat: -1
    });

    // Handle click/tap to start
    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game');
      });
    });
  }
}

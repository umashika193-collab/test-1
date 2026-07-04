import Phaser from 'phaser';
import { zzfx, initAudio, zzfxX } from '../zzfx';

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Background
    // Assuming the generated image is large, we might need to scale the tilesprite.
    // We will just create a tileSprite and set its display size.
    this.bg = this.add.tileSprite(160, 300, 1024, 1024, 'bg');
    this.bg.setScale(0.5); // Adjust based on the actual asset size
    
    // プレイヤーが下のUIエリア（Y:480〜600）に侵入しないように、物理判定の領域を画面上部（480px）に制限する
    this.physics.world.setBounds(0, 0, 320, 480);

    // Player
    this.player = this.physics.add.sprite(160, 400, 'player');
    this.player.setScale(0.06); // Scale down large generated image
    this.player.setCollideWorldBounds(true);
    // Make hitbox smaller than sprite
    this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.5);

    // Player Power Level
    this.powerLevel = 1;
    this.playerHistory = [];
    
    // Drone (Level 3 - Funnel)
    this.drone = this.add.sprite(0, 0, 'funnel');
    this.drone.setScale(0.04);
    this.drone.setVisible(false);
    
    // Boss State
    this.isBossStage = false;
    this.boss = null;
    this.bossBullets = this.physics.add.group();
    this.startTime = this.time.now;

    // Bullets Group
    this.bullets = this.add.group();
    this.enemyBullets = this.add.group();

    // Enemies & PowerUps Group
    this.enemies = this.physics.add.group();
    this.powerUps = this.physics.add.group();

    // Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Virtual Gamepad
    this.createVirtualGamepad();

    // Timers
    this.enemyTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
    this.lastFired = 0;
    
    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.bossBullets, this.hitPlayer, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);

    // Audio init on first interaction
    const startAudio = () => {
      initAudio();
      this.playStarWarsBGM();
    };
    this.input.once('pointerdown', startAudio);
    this.input.keyboard.once('keydown', startAudio);
    
    // If already initialized (e.g. after restart)
    if (zzfxX) {
      this.playStarWarsBGM();
    }

    this.events.once('shutdown', () => {
      if (this.bgmTimer) this.bgmTimer.destroy();
      this.bgmPlaying = false;
    });
  }

  playStarWarsBGM() {
    if (!zzfxX || this.bgmPlaying) return;
    this.bgmPlaying = true;

    // Extended Imperial March
    const notes = [
      // Part 1
      { f: 196, d: 0.4 }, { f: 196, d: 0.4 }, { f: 196, d: 0.4 },
      { f: 155.5, d: 0.3 }, { f: 233.1, d: 0.1 }, { f: 196, d: 0.4 },
      { f: 155.5, d: 0.3 }, { f: 233.1, d: 0.1 }, { f: 196, d: 0.8 },
      // Part 2
      { f: 293.6, d: 0.4 }, { f: 293.6, d: 0.4 }, { f: 293.6, d: 0.4 },
      { f: 311.1, d: 0.3 }, { f: 233.1, d: 0.1 }, { f: 185.0, d: 0.4 },
      { f: 155.5, d: 0.3 }, { f: 233.1, d: 0.1 }, { f: 196, d: 0.8 },
      // Part 3
      { f: 392.0, d: 0.4 }, { f: 196, d: 0.3 }, { f: 196, d: 0.1 },
      { f: 392.0, d: 0.4 }, { f: 370.0, d: 0.3 }, { f: 349.2, d: 0.1 },
      { f: 329.6, d: 0.15 }, { f: 311.1, d: 0.15 }, { f: 329.6, d: 0.5 }, { f: 0, d: 0.2 },
      { f: 207.6, d: 0.2 }, { f: 277.2, d: 0.4 }, { f: 261.6, d: 0.3 }, { f: 246.9, d: 0.1 },
      { f: 233.1, d: 0.15 }, { f: 220.0, d: 0.15 }, { f: 233.1, d: 0.5 }, { f: 0, d: 0.2 },
      { f: 155.5, d: 0.2 }, { f: 185.0, d: 0.4 }, { f: 155.5, d: 0.3 }, { f: 185.0, d: 0.1 },
      { f: 233.1, d: 0.4 }, { f: 196, d: 0.3 }, { f: 233.1, d: 0.1 }, { f: 293.6, d: 0.8 }
    ];

    const loopDuration = 13600;

    this.playLoop = () => {
      if (!this.scene.isActive() || this.isBossStage) return; // Stop if boss stage
      let t = zzfxX.currentTime + 0.05;
      notes.forEach(note => {
        if (note.f > 0) {
          const osc = zzfxX.createOscillator();
          const gain = zzfxX.createGain();
          
          // Add a lowpass filter to make it sound more like a brass/string synth rather than raw buzzer
          const filter = zzfxX.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = note.f * 4;

          osc.type = 'sawtooth';
          osc.frequency.value = note.f;
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
          gain.gain.linearRampToValueAtTime(0, t + note.d - 0.02);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(zzfxX.destination);
          
          osc.start(t);
          osc.stop(t + note.d);
        }
        t += note.d;
      });
      this.bgmTimer = this.time.delayedCall(loopDuration, this.playLoop, [], this);
    };
    this.playLoop();
  }

  playBossBGM() {
    if (!zzfxX) return;
    if (this.bgmTimer) this.bgmTimer.destroy(); // Stop current BGM loop scheduling
    
    const loopDuration = 30000; // 30 seconds
    
    this.bossPlayLoop = () => {
      if (!this.scene.isActive() || !this.isBossStage) return;
      let t = zzfxX.currentTime + 0.1;
      
      // Ominous, sweeping choral/synth melody (total 64 beats)
      const melody = [
        { f: 146.8, d: 4.0 }, { f: 164.8, d: 2.0 }, { f: 174.6, d: 2.0 },
        { f: 116.5, d: 4.0 }, { f: 130.8, d: 2.0 }, { f: 146.8, d: 2.0 },
        { f: 174.6, d: 4.0 }, { f: 196.0, d: 2.0 }, { f: 220.0, d: 2.0 },
        { f: 110.0, d: 4.0 }, { f: 138.6, d: 4.0 },
        { f: 146.8, d: 4.0 }, { f: 164.8, d: 2.0 }, { f: 174.6, d: 2.0 },
        { f: 116.5, d: 4.0 }, { f: 130.8, d: 2.0 }, { f: 146.8, d: 2.0 },
        { f: 220.0, d: 6.0 }, { f: 277.2, d: 2.0 },
        { f: 146.8, d: 4.0 }, { f: 0, d: 4.0 }
      ];
      
      melody.forEach(note => {
        // 64 beats * 0.46875 sec = exactly 30 seconds
        let dur = note.d * 0.46875; 
        if (note.f > 0) {
          const osc = zzfxX.createOscillator();
          const osc2 = zzfxX.createOscillator();
          const gain = zzfxX.createGain();
          const filter = zzfxX.createBiquadFilter();
          
          filter.type = 'lowpass';
          filter.frequency.value = note.f * 2;
          
          osc.type = 'sawtooth';
          osc.frequency.value = note.f;
          osc2.type = 'square';
          osc2.frequency.value = note.f * 0.5; // sub octave
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.06, t + dur * 0.2); 
          gain.gain.linearRampToValueAtTime(0, t + dur); 
          
          osc.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(zzfxX.destination);
          
          osc.start(t);
          osc2.start(t);
          osc.stop(t + dur);
          osc2.stop(t + dur);
        }
        t += dur;
      });
      
      this.bgmTimer = this.time.delayedCall(loopDuration, this.bossPlayLoop, [], this);
    };
    this.bossPlayLoop();
  }

  createVirtualGamepad() {
    // マルチタッチ対応（最大4点タッチまで認識させる）
    this.input.addPointer(2);

    const padX = 60;
    const padY = 520; // プレイ画面外の下部に配置
    const padSize = 35;

    this.dpad = { up: false, down: false, left: false, right: false };
    this.btnA = false;
    this.btnB = false;

    // Up
    this.addBtn(padX, padY - padSize, padSize, padSize, '▲', () => this.dpad.up = true, () => this.dpad.up = false);
    // Down
    this.addBtn(padX, padY + padSize, padSize, padSize, '▼', () => this.dpad.down = true, () => this.dpad.down = false);
    // Left
    this.addBtn(padX - padSize, padY, padSize, padSize, '◀', () => this.dpad.left = true, () => this.dpad.left = false);
    // Right
    this.addBtn(padX + padSize, padY, padSize, padSize, '▶', () => this.dpad.right = true, () => this.dpad.right = false);

    // A Button (Shoot)
    this.addBtn(260, 520, 45, 45, 'A', () => this.btnA = true, () => this.btnA = false);
    // B Button (Bomb - currently unused)
    this.addBtn(210, 550, 45, 45, 'B', () => this.btnB = true, () => this.btnB = false);
  }

  addBtn(x, y, w, h, label, onDown, onUp) {
    const btn = this.add.rectangle(x, y, w, h, 0xffffff, 0.2).setInteractive();
    const txt = this.add.text(x, y, label, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    
    btn.on('pointerdown', () => { btn.fillAlpha = 0.5; onDown(); });
    btn.on('pointerup', () => { btn.fillAlpha = 0.2; onUp(); });
    btn.on('pointerout', () => { btn.fillAlpha = 0.2; onUp(); });
  }

  spawnBoss() {
    this.isBossStage = true;
    this.boss = this.physics.add.sprite(160, -100, 'boss');
    this.boss.setScale(0.16); // Boss is twice as big (0.08 -> 0.16)
    this.boss.body.setSize(this.boss.width * 0.6, this.boss.height * 0.6); // Collision box doubles automatically with scale
    this.boss.hp = 100;
    this.boss.nextAttack = this.time.now + 3000;
    
    // Boss collisions
    this.physics.add.overlap(this.bullets, this.boss, this.hitBoss, null, this);
    this.physics.add.overlap(this.player, this.boss, this.hitPlayer, null, this);
    
    // Start Boss BGM
    this.playBossBGM();
  }

  bossShoot() {
    if (!this.boss || !this.boss.active || !this.player.active) return;
    
    // 5-way spread
    for (let i = -2; i <= 2; i++) {
      const bullet = this.add.rectangle(this.boss.x, this.boss.y + 40, 8, 8, 0xff00ff);
      this.physics.add.existing(bullet);
      this.bossBullets.add(bullet);
      
      const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y) + (i * 0.2);
      this.physics.velocityFromRotation(angle, 250, bullet.body.velocity);
    }
    zzfx(0.2, 0.05, 200, 0.05, 0, 0.2, 3, 1.5, -10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  hitBoss(bullet, boss) {
    if (!bullet.active || !boss.active) return;
    bullet.destroy();
    boss.hp--;
    
    boss.setTintFill(0xffffff);
    this.time.delayedCall(50, () => boss.clearTint());

    if (boss.hp <= 0) {
      this.defeatBoss(boss);
    } else {
      // Small hit sound
      zzfx(0.1, 0, 100, 0, 0, 0.1, 4, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0);
    }
  }

  defeatBoss(boss) {
    boss.destroy();
    this.isBossStage = false; 

    // Huge explosion sound
    zzfx(0.8, 0.2, 50, 0.1, 0.5, 2.0, 4, 1.5, 0, 0, 0, 0, 0, 1, 0, 0.5, 0, 0, 0, 0); 
    
    this.add.particles(boss.x, boss.y, 'boss', {
      speed: { min: -300, max: 300 }, angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 }, blendMode: 'ADD', lifespan: 1500, quantity: 150
    });

    // Game Clear Screen
    this.time.delayedCall(2000, () => {
      const cx = this.cameras.main.width / 2;
      const cy = 240; // Center of play area
      this.add.rectangle(cx, 300, 320, 600, 0xffffff, 0.9);
      this.add.text(cx, cy - 20, 'GAME CLEAR!!', { fontSize: '36px', fill: '#0000ff', fontStyle: 'bold' }).setOrigin(0.5);
      const btn = this.add.rectangle(cx, cy + 50, 200, 50, 0x000000, 1.0).setInteractive();
      this.add.text(cx, cy + 50, 'PLAY AGAIN', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (this.bgmTimer) this.bgmTimer.destroy();
        this.scene.restart();
      });
    });
  }

  spawnEnemy() {
    if (this.isBossStage || (this.boss && this.boss.active)) return; // Stop enemies during boss
    const x = Phaser.Math.Between(30, 290);
    const enemy = this.enemies.create(x, -40, 'enemy');
    if (enemy) {
      enemy.setScale(0.06); 
      enemy.body.setSize(enemy.width * 0.6, enemy.height * 0.6);
      enemy.setVelocityY(Phaser.Math.Between(80, 150));
      enemy.setAngle(180); 
      
      // Random movement setup
      enemy.startX = x;
      enemy.moveType = Phaser.Math.Between(0, 2); // 0: straight, 1: sine, 2: diagonal bounce
      if (enemy.moveType === 2) {
        enemy.setVelocityX(Phaser.Math.Between(-60, 60));
      }
      
      // Shoot timer
      enemy.nextShootTime = this.time.now + Phaser.Math.Between(800, 2500);
    }
  }

  enemyShoot(enemy) {
    if (!enemy.active || !this.player.active) return;
    
    // Create red bullet
    const bullet = this.add.rectangle(enemy.x, enemy.y + 20, 6, 6, 0xff0000);
    this.physics.add.existing(bullet);
    this.enemyBullets.add(bullet);
    
    // Aim directly at player
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    this.physics.velocityFromRotation(angle, 250, bullet.body.velocity);
    
    // Enemy shoot sound (lower pitch)
    zzfx(0.1, 0.05, 300, 0.01, 0, 0.1, 2, 1.5, -20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  shoot() {
    const now = this.time.now;
    if (now > this.lastFired) {
      // Helper function to create bullet with angle
      const createBullet = (x, y, angle) => {
        const bullet = this.add.rectangle(x, y - 20, 4, 16, 0xffff00);
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
        this.physics.velocityFromAngle(angle - 90, 500, bullet.body.velocity);
        bullet.setAngle(angle);
      };

      // Level 1: Straight, Level 2+: 3-Way spread
      if (this.powerLevel === 1) {
        createBullet(this.player.x, this.player.y, 0);
      } else if (this.powerLevel >= 2) {
        createBullet(this.player.x, this.player.y, 0);
        createBullet(this.player.x, this.player.y, -15);
        createBullet(this.player.x, this.player.y, 15);
      }
      
      // Level 3: Drone shoots too
      if (this.powerLevel >= 3 && this.drone.visible) {
        createBullet(this.drone.x, this.drone.y, 0);
      }

      // Shoot sound: more laser-like (high freq, sharp negative slide)
      zzfx(0.15, 0.05, 1500, 0.01, 0.02, 0.1, 1, 1.5, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); 
      
      this.lastFired = now + 150; 
    }
  }

  hitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();

    // 15% chance to drop powerup item
    if (Phaser.Math.Between(1, 100) <= 15) {
      const pu = this.physics.add.sprite(enemy.x, enemy.y, 'powerup');
      pu.setScale(0.04); // Adjust scale based on generated image size
      this.powerUps.add(pu);
      pu.body.setVelocityY(80);
      
      // Pulse animation
      this.tweens.add({
        targets: pu,
        alpha: 0.5,
        scale: 0.05,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    enemy.destroy();
    
    // Explosion sound: use noise parameter (1) for actual explosion
    zzfx(0.3, 0.1, 150, 0.05, 0.1, 0.5, 4, 1.5, 0, 0, 0, 0, 0, 1, 0, 0.2, 0, 0, 0, 0);

    // Add basic particle explosion
    const particles = this.add.particles(enemy.x, enemy.y, 'enemy', {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.02, end: 0 },
      blendMode: 'ADD',
      lifespan: 200, // 0.2秒で消滅
      quantity: 5
    });
  }

  collectPowerUp(player, powerUp) {
    powerUp.destroy();
    
    // PowerUp Sound (Chime: high freq, long decay)
    zzfx(0.3, 0, 1000, 0.05, 0.2, 0.4, 0, 1.5, 0, 0, 100, 0.05, 0, 0, 0, 0, 0, 0.5, 0, 0);
    
    if (this.powerLevel < 3) {
      this.powerLevel++;
      if (this.powerLevel === 3) {
        this.drone.setVisible(true);
        // Clear history so drone snaps perfectly
        this.playerHistory = [];
      }
    }
  }

  hitPlayer(player, hazard) {
    if (!player.active || !hazard.active) return;
    if (this.player.isInvincible) return; // Invincibility check
    
    hazard.destroy(); // Destroy enemy or bullet that hit the player
    
    // Funnel Shield Mechanic
    if (this.powerLevel === 3) {
      this.powerLevel = 2; // Downgrade
      this.drone.setVisible(false);
      
      // Shield break sound (glassy shatter)
      zzfx(0.4, 0.1, 800, 0.05, 0.1, 0.3, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0);
      
      // Shield break particles
      this.add.particles(this.drone.x, this.drone.y, 'funnel', {
        speed: { min: -100, max: 100 }, scale: { start: 0.04, end: 0 },
        blendMode: 'ADD', lifespan: 300, quantity: 15
      });
      
      // Temporary invincibility
      this.player.isInvincible = true;
      this.tweens.add({
        targets: this.player, alpha: 0.2, duration: 100, yoyo: true, repeat: 10,
        onComplete: () => { this.player.alpha = 1; this.player.isInvincible = false; }
      });
      return;
    }
    
    // Massive explosion sound
    zzfx(0.5, 0.1, 80, 0.1, 0.3, 1.0, 4, 1.5, 0, 0, 0, 0, 0, 1, 0, 0.4, 0, 0, 0, 0); 
    
    // Player explosion particles
    this.add.particles(player.x, player.y, 'player', {
      speed: { min: -150, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.06, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      quantity: 30
    });

    player.setActive(false).setVisible(false);
    player.body.enable = false;

    // Show Game Over and Continue button after delay
    this.time.delayedCall(1000, () => {
      const cx = this.cameras.main.width / 2;
      const cy = 240; // Center of play area
      
      // Dim background
      this.add.rectangle(cx, 300, 320, 600, 0x000000, 0.7);
      
      this.add.text(cx, cy - 40, 'GAME OVER', { fontSize: '32px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);

      const btn = this.add.rectangle(cx, cy + 40, 180, 50, 0xffffff, 0.8).setInteractive();
      this.add.text(cx, cy + 40, 'CONTINUE', { fontSize: '24px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
      
      btn.on('pointerdown', () => {
        btn.fillAlpha = 0.5;
        this.scene.restart();
      });
    });
  }

  update(time, delta) {
    // Scroll background
    this.bg.tilePositionY -= 2;

    // Player movement
    let vx = 0;
    let vy = 0;
    const speed = 200;

    if (this.cursors.left.isDown || this.dpad.left) vx = -speed;
    else if (this.cursors.right.isDown || this.dpad.right) vx = speed;

    if (this.cursors.up.isDown || this.dpad.up) vy = -speed;
    else if (this.cursors.down.isDown || this.dpad.down) vy = speed;

    this.player.setVelocity(vx, vy);

    // Record history for drone
    if (this.player.active) {
      this.playerHistory.unshift({ x: this.player.x, y: this.player.y });
      if (this.playerHistory.length > 20) {
        this.playerHistory.pop();
      }
      // Update drone position to trail behind
      if (this.powerLevel >= 3 && this.playerHistory.length >= 10) {
        // Use the 10th previous frame position to make it trail nicely
        const hist = this.playerHistory[9];
        this.drone.setPosition(hist.x, hist.y);
        // Add a slight hover wobble to the funnel
        this.drone.setRotation(Math.sin(time / 100) * 0.2);
      }
    }

    // Boss Spawn Check (60 seconds)
    if ((time - this.startTime) > 60000 && !this.isBossStage && !this.boss) {
      this.spawnBoss();
    }

    // Boss Logic
    if (this.boss && this.boss.active) {
      if (this.boss.y < 80) {
        this.boss.y += 1; // Enter screen
      } else {
        // Boss fight movement
        this.boss.x = 160 + Math.sin(time / 800) * 100;
        
        if (time > this.boss.nextAttack) {
          this.bossShoot();
          this.boss.nextAttack = time + Phaser.Math.Between(800, 1500);
        }
      }
    }

    // Player shooting
    if ((this.keySpace.isDown || this.btnA) && this.player.active) {
      this.shoot();
    }

    // Cleanup bullets and enemies
    this.bullets.getChildren().forEach(b => {
      if (b && b.y < -20) b.destroy();
    });

    this.enemies.getChildren().forEach(e => {
      if (!e) return;
      if (e.y > 640) {
        e.destroy();
        return;
      }
      
      // Apply random movement patterns
      if (e.moveType === 1) {
        // Sine wave swing
        e.x = e.startX + Math.sin(time / 300 + e.y / 60) * 60;
      } else if (e.moveType === 2) {
        // Diagonal wall bounce
        if (e.x < 20) e.setVelocityX(Math.abs(e.body.velocity.x || 50));
        if (e.x > 300) e.setVelocityX(-Math.abs(e.body.velocity.x || 50));
      }

      // Enemy shooting
      if (time > e.nextShootTime) {
        this.enemyShoot(e);
        e.nextShootTime = time + Phaser.Math.Between(1500, 3500);
      }
    });

    this.enemyBullets.getChildren().forEach(b => {
      if (b && (b.y > 640 || b.y < -20 || b.x < -20 || b.x > 340)) b.destroy();
    });

    this.bossBullets.getChildren().forEach(b => {
      if (b && (b.y > 640 || b.y < -20 || b.x < -20 || b.x > 340)) b.destroy();
    });

    this.powerUps.getChildren().forEach(p => {
      if (p && p.y > 640) p.destroy();
    });
  }
}

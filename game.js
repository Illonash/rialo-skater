/* =========================================================
   RIALO SKATER — 6 Layer Parallax
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

const BASE_SPEED = 180;       
const OBST_MIN_DELAY = 1600;  
const OBST_MAX_DELAY = 2400;  
const JUMP_VELOCITY = -470;   
const GRAVITY_Y = 1400;       
const MAX_LIVES = 3;

const ASSETS = {
  skater: 'assets/skater_girl.png',
  city: [
    'assets/maps/city/city1.png',
    'assets/maps/city/city2.png',
    'assets/maps/city/city3.png',
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png',
  ],
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/cone.png',
  ],
  bgm: 'assets/audio/bgm.mp3',
};

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  preload() {
    ASSETS.city.forEach((p, i) => this.load.image(`city${i+1}`, p));
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_cone', ASSETS.obstacles[1]);
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth: 128, frameHeight: 128, endFrame: 8 });
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    // -------- Musik
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.35 });
        this.bgm.play();
      }
    } catch(_) {}

    // -------- Parallax Background (6 layer)
    this.layers = [];
    for (let i = 0; i < 6; i++) {
      const layer = this.add.tileSprite(0, 0, GAME_W, GAME_H, `city${i+1}`).setOrigin(0,0);
      this.layers.push(layer);
    }
    this.parallaxSpeed = [6, 10, 14, 20, 28, 36];

    // -------- Ground Line (kuning, invisible buat debug)
    this.groundY = GAME_H - 120; // posisi lantai
    // this.add.line(0,0, 0,this.groundY, GAME_W,this.groundY, 0xffff00).setOrigin(0,0);

    // -------- Player
    this.player = this.physics.add.sprite(180, this.groundY - 64, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animasi
    this.anims.create({ key: 'ride', frames: this.anims.generateFrameNumbers('skater', { start: 1, end: 4 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('skater', { start: 5, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'idle', frames: [{ key: 'skater', frame: 0 }] });
    this.anims.create({ key: 'crash', frames: [{ key: 'skater', frame: 8 }] });
    this.player.play('ride');

    // -------- Control
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // -------- Score & Lives
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16, 18, 'Score: 0', { fontSize: '28px', color: '#ffffff' });
    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 28 - i*28, 18, '❤', { fontSize: '28px' }).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    // -------- Obstacles
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);
    this.scheduleNextObstacle();

    // -------- Score Timer
    this.time.addEvent({ delay: 150, loop: true, callback: () => { this.score++; this.scoreText.setText(`Score: ${this.score}`); }});

    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const keys = ['obs_barrier','obs_cone'];
    const key = Phaser.Utils.Array.GetRandom(keys);

    const y = this.groundY; 
    const obj = this.obstacles.create(GAME_W + 40, y, key).setOrigin(0.5,1);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setVelocityX(-BASE_SPEED);
    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;
    const onGround = this.player.body.blocked.down || this.player.y >= this.groundY - 64;
    if (onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
    }
  }

  handleHit(player, obstacle) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;
    this.lives--;
    this.updateHearts();
    player.play('crash');
    this.invulnUntil = now + 1000;
    this.time.delayedCall(200, () => player.play('ride'));
    if (this.lives <= 0) this.gameOver();
  }

  updateHearts() {
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver() {
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.setVelocityX(0);
    if (this.bgm) this.bgm.stop();
  }

  update(_, delta) {
    const dt = delta/1000;
    this.layers.forEach((layer,i)=> layer.tilePositionX += this.parallaxSpeed[i]*dt);

    if (!this.isGameOver) {
      const onGround = this.player.body.blocked.down || this.player.y >= this.groundY - 64;
      if (onGround && this.player.anims.currentAnim?.key === 'jump') {
        this.player.play('ride');
      }
    }

    if (this.cursors.space?.isDown || this.cursors.up?.isDown) this.tryJump();
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0f14',
  parent: 'game-root',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false }},
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [GameScene],
};

new Phaser.Game(config);

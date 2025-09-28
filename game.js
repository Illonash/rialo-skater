/* =========================================================
   RIALO SKATER — Fix Background & Ground
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
  splash: 'assets/splash_16x9.png',
  mapPreview: 'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
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
    'assets/obstacles/barrier2.png',
    'assets/obstacles/cone.png',
  ],
  bgm: 'assets/audio/bgm.mp3',
};

// ---------- Splash Scene ----------
class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }
  preload() { this.load.image('splashBg', ASSETS.splash); }
  create() {
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(s);

    const play = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({ cursor: 'pointer' });
    this.add.text(play.x, play.y, 'PLAY', {
      fontFamily: 'system-ui', fontSize: '36px', color: '#1b1b1b', fontStyle: '900'
    }).setOrigin(0.5);
    play.on('pointerup', () => this.scene.start('PreviewScene'));

    this.add.text(GAME_W/2, GAME_H - 28, 'Powered by Rialo', {
      fontFamily: 'system-ui', fontSize: '18px', color: '#cfd8dc'
    }).setOrigin(0.5);
  }
}

// ---------- Preview Scene ----------
class PreviewScene extends Phaser.Scene {
  constructor() { super('PreviewScene'); }
  preload() {
    this.load.image('mapPreview', ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create() {
    this.cameras.main.setBackgroundColor('#0f1316');

    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily: 'system-ui', fontSize: '36px', color: '#b2ebf2'
    }).setOrigin(0.5);

    this.add.image(380, 340, 'mapPreview').setScale(0.65);
    this.add.text(380, 180, 'Map', { fontSize: '28px', color: '#80deea' }).setOrigin(0.5);

    this.add.image(900, 340, 'charPreview').setScale(0.9);
    this.add.text(900, 180, 'Character', { fontSize: '28px', color: '#80deea' }).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({ cursor: 'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily: 'system-ui', fontSize: '36px', fontStyle: '900', color: '#0a0f12'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('GameScene'));
  }
}

// ---------- Game Scene (FIX: single-strip city + real ground) ----------
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    // parallax city (6 layer)
    for (let i=1;i<=6;i++) this.load.image(`city${i}`, `assets/maps/city/city${i}.png`);
    // Obstacles
    this.load.image('obs_barrier',  'assets/obstacles/barrier.png');
    this.load.image('obs_barrier2', 'assets/obstacles/barrier2.png');
    this.load.image('obs_cone',     'assets/obstacles/cone.png');
    // Skater 9 frame @128x128
    this.load.spritesheet('skater', 'assets/skater_girl.png', {
      frameWidth: 128, frameHeight: 128, endFrame: 8
    });
    // BGM opsional
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
  }

  create() {
    // ====== Musik (aman jika file tidak ada) ======
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.35 });
        this.bgm.play();
      }
    } catch(_) {}

    // ====== PARAM ETALON ======
    this.groundY = GAME_H - 90;     // tinggi lantai (kamu bisa tweak)
    const CITY_H = 324;             // tinggi asli sprite city (assets parallax dari itch kira-kira segini)
    const CITY_Y = this.groundY - CITY_H + 8; // posisi y strip city supaya “duduk” di lantai

    // ====== SINGLE-STRIP BACKGROUND (no double) ======
    // Lebarnya GAME_W (biar mengisi horisontal), tingginya pakai tinggi asli CITY_H agar tidak tiling vertikal
    this.bg = this.add.tileSprite(0, CITY_Y, GAME_W, CITY_H, 'cityStrip').setOrigin(0, 0);
    this.bgSpeed = 30; // parallax pelan & nyaman

    // ====== PHYSICS: real ground ======
    // Bikin “lantai” fisik setebal 10px di posisi groundY
    const groundGfx = this.add.rectangle(GAME_W / 2, this.groundY, GAME_W, 10, 0x000000, 0); // invisible
    this.physics.add.existing(groundGfx, true);  // true => Static Body
    this.ground = groundGfx.body;                // simpan body-nya

    // ====== PLAYER ======
    this.player = this.physics.add.sprite(160, this.groundY - 64, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    // hitbox yang fair
    this.player.body.setSize(60, 80).setOffset(34, 36);

    this.anims.create({ key: 'ride',  frames: this.anims.generateFrameNumbers('skater',{start:1, end:4}), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump',  frames: this.anims.generateFrameNumbers('skater',{start:5, end:7}), frameRate: 12 });
    this.anims.create({ key: 'crash', frames: [{ key:'skater', frame:8 }], frameRate: 1 });

    this.player.play('ride');

    // Collider dengan lantai → memastikan posisi kaki pas di ground & flag blocked.down bekerja
    this.physics.add.collider(this.player, groundGfx);

    // ====== Kontrol ======
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // ====== UI ======
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16, 18, 'Score: 0', { fontFamily: 'system-ui', fontSize: '28px', color: '#ffffff' });
    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 28 - i * 28, 18, '❤', { fontSize: '28px' }).setTint(0xff6b81).setOrigin(1, 0);
      this.hearts.push(h);
    }

    // ====== Obstacles ======
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);
    this.scheduleNextObstacle();

    // Score tick
    this.time.addEvent({ delay: 150, loop: true, callback: () => {
      this.score += 1; this.scoreText.setText(`Score: ${this.score}`);
    }});

    // Flags
    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const keys = ['obs_barrier', 'obs_barrier2', 'obs_cone'];
    const key  = Phaser.Utils.Array.GetRandom(keys);

    // Tempel ke lantai (Origin 0.5,1 => titik anchor di kaki obstacle)
    const obj = this.obstacles.create(GAME_W + 40, this.groundY, key);
    obj.setOrigin(0.5, 1);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setVelocityX(-BASE_SPEED);

    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;
    // Sekarang kita pakai flag fisik: blocked.down atau touching.down
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    if (onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
    }
  }

  handleHit(player, obstacle) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives -= 1;
    this.updateHearts();

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(200, () => player.clearTint());
    this.time.delayedCall(220, () => player.play('ride'));

    if (this.lives <= 0) this.gameOver();
  }

  updateHearts() {
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver() {
    this.isGameOver = true;
    this.player.play('crash');
    if (this.bgm) this.bgm.stop();
    this.obstacles.children.iterate(o => o && o.setVelocityX(0));

    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0);
    const msg = this.add.text(GAME_W / 2, GAME_H / 2, `Game Over\nScore: ${this.score}`, {
      fontFamily: 'system-ui', fontSize: '42px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
  }

  update(time, delta) {
    // Parallax halus (hanya horizontal)
    this.bg.tilePositionX += this.bgSpeed * (delta / 1000);

    if (this.cursors.space.isDown || this.cursors.up.isDown) this.tryJump();

    // Bersihkan obstacle di luar layar
    this.obstacles.children.iterate(o => { if (o && o.x < -100) o.destroy(); });
  }
}

// ---------- Config ----------
const config = {
  type: Phaser.AUTO, width: GAME_W, height: GAME_H, parent:'game-root',
  physics:{ default:'arcade', arcade:{gravity:{y:0}, debug:false} },
  scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene:[SplashScene,PreviewScene,GameScene]
};
new Phaser.Game(config);

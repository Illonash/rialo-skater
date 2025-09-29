/* =========================================================
   RIALO SKATER — Splash → Preview → Game (Phaser 3)
   ========================================================= */

/* ================== KONFIG & KONSTANTA ================== */
const GAME_W = 1280;
const GAME_H = 720;

// Tweak cepat tampilan/gameplay
const SKY_COLOR    = '#13A9DB'; // warna langit (area atas)
const GROUND_RATIO = 0.5;      // tinggi ground relatif layar (0..1) -> 0.62 ~ agak ke tengah
const PLAYER_X     = 160;       // posisi X awal pemain
const PLAYER_FLOOR_OFFSET = 60; // seberapa tinggi badan pemain di atas ground
const OB_SCALE     = 0.85;      // skala obstacle (lebih kecil sedikit)

// Fisika & tempo
const BASE_SPEED   = 180;       // kecepatan obstacles mendekat
const OBST_MIN_DELAY = 1600;    // spawn min (ms)
const OBST_MAX_DELAY = 2400;    // spawn max (ms)
const JUMP_VELOCITY = -470;     // kekuatan lompat
const GRAVITY_Y      = 1400;    // gravitasi pemain
const MAX_LIVES      = 3;

// Aset
const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater:      'assets/skater_girl.png', // 1152x128 (9 frame @ 128x128)
  city:        'assets/maps/city/city6.png', // skyline yang dipakai in-game (tileSprite)
  obstacles: {
    barrier:  'assets/obstacles/barrier.png',
    barrier2: 'assets/obstacles/barrier2.png',
    cone:     'assets/obstacles/cone.png',
  },
  bgm: 'assets/audio/bgm.mp3',  // opsional
};

/* ======================= SCENE: Splash =================== */
class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }
  preload() {
    this.load.image('splashBg', ASSETS.splash);
  }
  create() {
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const scale = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(scale);

    // Tombol PLAY
    const btn = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 280, 78, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({ cursor:'pointer' });
    this.add.text(btn.x, btn.y, 'PLAY', {
      fontFamily:'system-ui,sans-serif', fontSize:'38px', color:'#1b1b1b', fontStyle:'900'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('PreviewScene'));

    // Footer
    this.add.text(GAME_W/2, GAME_H-28, 'Powered by Rialo', {
      fontFamily:'system-ui,sans-serif', fontSize:'18px', color:'#cfd8dc'
    }).setOrigin(0.5);
  }
}

/* ====================== SCENE: Preview =================== */
class PreviewScene extends Phaser.Scene {
  constructor() { super('PreviewScene'); }
  preload() {
    this.load.image('mapPreview',  ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create() {
    this.cameras.main.setBackgroundColor('#0f1316');

    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily:'system-ui,sans-serif', fontSize:'36px', color:'#b2ebf2'
    }).setOrigin(0.5);

    // Kartu Map
    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y - mapPanel.height/2 - 28, 'Map', {
      fontFamily:'system-ui,sans-serif', fontSize:'28px', color:'#80deea'
    }).setOrigin(0.5);

    // Kartu Character
    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y - charPanel.height/2 - 28, 'Character', {
      fontFamily:'system-ui,sans-serif', fontSize:'28px', color:'#80deea'
    }).setOrigin(0.5);

    // Tombol SKATE
    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({ cursor:'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily:'system-ui,sans-serif', fontSize:'36px', color:'#0a0f12', fontStyle:'900'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('GameScene'));

    // Back
    const back = this.add.text(24, 24, '← Back', { fontFamily:'system-ui,sans-serif', fontSize:'20px', color:'#90caf9' })
      .setInteractive({ cursor:'pointer' });
    back.on('pointerup', () => this.scene.start('SplashScene'));
  }
}

/* ======================== SCENE: Game ==================== */
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    // Latar
    this.load.image('skyline', ASSETS.city);

    // Obstacles
    this.load.image('obs_barrier',  ASSETS.obstacles.barrier);
    this.load.image('obs_barrier2', ASSETS.obstacles.barrier2);
    this.load.image('obs_cone',     ASSETS.obstacles.cone);

    // Skater (9 frames)
    this.load.spritesheet('skater', ASSETS.skater, {
      frameWidth:128, frameHeight:128, endFrame:8
    });

    // Musik opsional
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    // ===== Dunia & background
    this.cameras.main.setBackgroundColor(SKY_COLOR);
    this.groundY = Math.round(GAME_H * GROUND_RATIO);

    // Skyline ditempel di bawah & selebar layar
    this.sky = this.add.tileSprite(0, this.groundY, GAME_W, this.groundY, 'skyline').setOrigin(0,1);
    // Garis ground tipis (opsional)
    this.add.rectangle(0, this.groundY, GAME_W, 4, 0x0e8ac2, 0.85).setOrigin(0,1);

    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);

    // ===== Player
    this.player = this.physics.add.sprite(PLAYER_X, this.groundY - PLAYER_FLOOR_OFFSET, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animasi
    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater', {start:1, end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater', {start:5, end:7}), frameRate:12 });
    this.anims.create({ key:'idle',  frames:[{ key:'skater', frame:0 }], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{ key:'skater', frame:8 }], frameRate:1 });
    this.player.play('ride');

    // Kontrol
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // ===== UI
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(18, 18, 'Score: 0', {
      fontFamily:'system-ui,sans-serif', fontSize:'32px', color:'#ffffff'
    });

    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 24 - i*28, 18, '❤', { fontSize:'28px' }).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    // ===== Obstacles
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);

    // Game flags
    this.isGameOver = false;
    this.invulnUntil = 0;
    this.doubleJumpLeft = 1;

    // Score ticker
    this.time.addEvent({
      delay: 150, loop: true,
      callback: () => { if (!this.isGameOver) { this.score += 1; this.scoreText.setText(`Score: ${this.score}`); } }
    });

    // Spawn pertama
    this.scheduleNextObstacle();

    // Musik aman kalau file ada
    try { if (this.cache.audio.exists('bgm')) this.sound.add('bgm', { loop:true, volume:0.35 }).play(); } catch {}

    // Reset double jump saat "mendarat"
    this.physics.world.on('worldstep', () => {
      if (!this.isGameOver && this.isOnGround()) this.doubleJumpLeft = 1;
    });
  }

  /* =============== Helpers =============== */
  isOnGround() {
    return this.player.y >= (this.groundY - PLAYER_FLOOR_OFFSET) - 1 && this.player.body.velocity.y >= 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const keys = ['obs_barrier', 'obs_barrier2', 'obs_cone'];
    const key  = Phaser.Utils.Array.GetRandom(keys);

    const o = this.obstacles.create(GAME_W + 40, this.groundY, key);
    o.setOrigin(0.5, 1);
    o.setScale(OB_SCALE);
    o.body.allowGravity = false;
    o.setImmovable(true);

    // Hitbox proporsional & nempel ground
    const bw = o.width  * OB_SCALE;
    const bh = o.height * OB_SCALE;
    o.body.setSize(bw * 0.7, bh * 0.6)
      .setOffset((o.width - bw)/2 + bw*0.15, (o.height - bh)/2 + bh*0.4);

    o.setVelocityX(-BASE_SPEED);
    o.checkWorldBounds = true;
    o.outOfBoundsKill = true;

    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;

    if (this.isOnGround()) {
      this.player.setY(this.groundY - PLAYER_FLOOR_OFFSET);
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
      this.doubleJumpLeft = 1;
    } else if (this.doubleJumpLeft > 0) {
      this.doubleJumpLeft--;
      this.player.setVelocityY(JUMP_VELOCITY * 0.92);
      this.player.play('jump', true);
    }
  }

  handleHit(player, obstacle) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives -= 1;
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 900;
    this.time.delayedCall(180, () => player.clearTint());
    this.time.delayedCall(200, () => { if (!this.isGameOver) player.play('ride'); });

    if (this.lives <= 0) this.gameOver();
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // hentikan dunia
    this.obstacles.children.iterate(o => o && o.setVelocityX(0));
    this.player.setVelocity(0,0).play('crash');
    this.player.body.allowGravity = false;

    // overlay
    this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.55).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 560, 280, 0x0f172a, 0.96)
      .setStrokeStyle(6, 0x22e3a3);

    this.add.text(GAME_W/2, panel.y-80, 'Game Over', {
      fontFamily:'system-ui,sans-serif', fontSize:'52px', color:'#e3f2fd', fontStyle:'900'
    }).setOrigin(0.5);

    this.add.text(GAME_W/2, panel.y-20, `Score: ${this.score}`, {
      fontFamily:'system-ui,sans-serif', fontSize:'28px', color:'#b2ebf2'
    }).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2-120, panel.y+70, 200, 56, 0x22e3a3)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor:'pointer' });
    this.add.text(btnR.x, btnR.y, 'Restart', {
      fontFamily:'system-ui,sans-serif', fontSize:'24px', fontStyle:'800', color:'#061016'
    }).setOrigin(0.5);
    btnR.on('pointerup', () => this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2+120, panel.y+70, 200, 56, 0x1DA1F2)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor:'pointer' });
    this.add.text(btnS.x, btnS.y, 'Share', {
      fontFamily:'system-ui,sans-serif', fontSize:'24px', fontStyle:'800', color:'#ffffff'
    }).setOrigin(0.5);
    btnS.on('pointerup', () => {
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    // geser skyline pelan
    this.sky.tilePositionX += 24 * dt;

    // keyboard jump (space/↑)
    if (!this.isGameOver && (this.cursors.space?.justDown || this.cursors.up?.justDown)) {
      this.tryJump();
    }

    // kembali ke ride saat mendarat
    if (!this.isGameOver && this.isOnGround() && this.player.anims.currentAnim?.key === 'jump') {
      this.player.play('ride');
    }

    // bersihkan obstacle jauh
    this.obstacles.children.iterate(o => { if (o && o.x < -120) o.destroy(); });
  }
}

/* ====================== PHASER CONFIG ==================== */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-root',
  backgroundColor: SKY_COLOR,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

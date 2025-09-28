/* =========================================================
   RIALO SKATER — Three Scenes (Splash -> Preview -> Game)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

// Kecepatan dasar (bisa di-tweak)
const BASE_SPEED = 180;               // kecepatan lari/gerak tanah
const OBST_MIN_DELAY = 1600;          // jeda minimal spawn obstacle (ms)
const OBST_MAX_DELAY = 2400;          // jeda maksimal spawn obstacle (ms)
const JUMP_VELOCITY = -470;           // kekuatan lompat
const GRAVITY_Y = 1400;               // gravitasi pemain
const MAX_LIVES = 3;

// Aset & path (sesuaikan dengan repo kamu saat ini)
const ASSETS = {
  splash: 'assets/splash_16x9.png',
  mapPreview: 'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater: 'assets/skater_girl.png',                        // spritesheet 1152x128 (9 frame @ 128x128)
  // Parallax city
  city: [
    'assets/maps/city/city1.png',
    'assets/maps/city/city2.png',
    'assets/maps/city/city3.png',
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png',
  ],
  // Obstacles
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/barrier2.png',
    'assets/obstacles/cone.png',
  ],
  // Musik (opsional — kalau file tidak ada, game tetap jalan)
  bgm: 'assets/audio/bgm.mp3',
};

// ---------- Splash Scene ----------
class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }
  preload() {
    this.load.image('splashBg', ASSETS.splash);
    this.load.image('mapPreview', ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create() {
    // Background splash
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    // Scale cover
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(s);

    // Tombol PLAY
    const play = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({ cursor: 'pointer' });
    this.add.text(play.x, play.y, 'PLAY', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px', color: '#1b1b1b', fontStyle: '900'
    }).setOrigin(0.5);

    play.on('pointerup', () => this.scene.start('PreviewScene'));

    // Footer "Powered by Rialo"
    this.add.text(GAME_W/2, GAME_H - 28, 'Powered by Rialo', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#cfd8dc'
    }).setOrigin(0.5);
  }
}

// ---------- Preview (Map & Character) Scene ----------
class PreviewScene extends Phaser.Scene {
  constructor() { super('PreviewScene'); }
  create() {
    // Backdrop gelap halus
    this.cameras.main.setBackgroundColor('#0f1316');

    // Judul kecil
    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px', color: '#b2ebf2'
    }).setOrigin(0.5);

    // Kartu Map (kiri)
    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf, 1);
    const mapImg = this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y - mapPanel.height/2 - 28, 'Map', {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#80deea'
    }).setOrigin(0.5);

    // Kartu Character (kanan)
    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf, 1);
    const charImg = this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y - charPanel.height/2 - 28, 'Character', {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#80deea'
    }).setOrigin(0.5);

    // Tombol SKATE
    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({ cursor: 'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily: 'system-ui, sans-serif', fontSize: '36px', fontStyle: '900', color: '#0a0f12'
    }).setOrigin(0.5);

    btn.on('pointerup', () => {
      this.scene.start('GameScene', { map: 'city', char: 'skaterGirl' });
    });

    // Back kecil (opsional)
    const back = this.add.text(24, 24, '← Back', { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#90caf9' })
      .setInteractive({ cursor: 'pointer' });
    back.on('pointerup', () => this.scene.start('SplashScene'));
  }
}

// ---------- Game Scene ----------
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  preload() {
    // City parallax
    this.layers = [
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city1').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city2').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city3').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city4').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city5').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city6').setOrigin(0,0),

    // Obstacles
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_barrier2', ASSETS.obstacles[1]);
    this.load.image('obs_cone', ASSETS.obstacles[2]);
    // Skater spritesheet (9 frame @ 128x128)
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth: 128, frameHeight: 128, endFrame: 8 });

    // Musik (opsional)
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    // -------- Musik (aman jika file tidak ada)
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop: true, volume: 0.35 });
        this.bgm.play();
      }
    } catch(_) {}

    // -------- Parallax background (lebih lambat)
    this.layers = [
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city1').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city2').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city3').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city4').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city5').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city6').setOrigin(0,0),
    ];
    // Kecepatan parallax (px/detik) — kecil agar nyaman
    this.parallaxSpeed = [6, 10, 14, 20, 28, 36];

    // -------- Physics world
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
    this.groundY = GAME_H - 86; // ketinggian “tanah” imajiner

    // Player
    this.player = this.physics.add.sprite(160, this.groundY - 64, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    // Hitbox lebih kecil (fair)
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animations
    this.anims.create({ key: 'ride', frames: this.anims.generateFrameNumbers('skater', { start: 1, end: 4 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('skater', { start: 5, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'idle', frames: [{ key: 'skater', frame: 0 }], frameRate: 1 });
    this.anims.create({ key: 'crash', frames: [{ key: 'skater', frame: 8 }], frameRate: 1 });

    this.player.play('ride');

    // Kontrol lompat
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // Score & Lives (hearts)
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16, 18, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#ffffff'
    });
    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 28 - i*28, 18, '❤', { fontSize: '28px' }).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    // Grup Obstacles
    this.obstacles = this.physics.add.group();
    this.lastSpawnAt = 0;

    // Collider
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);

    // Timer score dan spawn
    this.time.addEvent({ delay: 150, loop: true, callback: () => { this.score += 1; this.scoreText.setText(`Score: ${this.score}`); }});
    this.scheduleNextObstacle();

    // Flag status
    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    // Pilih tekstur random
    const keys = ['obs_barrier', 'obs_barrier2', 'obs_cone'];
    const key = Phaser.Utils.Array.GetRandom(keys);

    const y = this.groundY - 12; // dasar obstacle
    const obj = this.obstacles.create(GAME_W + 40, y, key);
    obj.setOrigin(0.5, 1);
    obj.setImmovable(true);
    obj.body.allowGravity = false;

    // Skala & hitbox yang wajar biar fair
    obj.setScale(0.95);
    obj.body.setSize(obj.width * 0.7, obj.height * 0.6).setOffset(obj.width * 0.15, obj.height * 0.4);

    // Kecepatan mendekat (lebih santai)
    obj.setVelocityX(-BASE_SPEED);

    // Hapus ketika keluar layar
    obj.checkWorldBounds = true;
    obj.outOfBoundsKill = true;

    // Jadwalkan spawn berikutnya
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

    this.lives -= 1;
    this.updateHearts();

    // Efek “crash singkat” + invuln 1000ms
    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(200, () => player.clearTint());
    this.time.delayedCall(220, () => player.play('ride'));

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Knockback kecil
      player.setVelocityX(-30);
      this.time.delayedCall(200, () => player.setVelocityX(0));
    }
  }

  updateHearts() {
    this.hearts.forEach((h, i) => {
      h.setAlpha(i < this.lives ? 1 : 0.25);
    });
  }

  gameOver() {
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.children.iterate(o => o && o.setVelocityX(0));
    if (this.bgm) this.bgm.stop();

    // Overlay
    const dim = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.6).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 620, 320, 0x0f172a, 0.95)
      .setStrokeStyle(6, 0x22e3a3);

    this.add.text(GAME_W/2, panel.y - 100, 'Game Over', {
      fontFamily: 'system-ui, sans-serif', fontSize: '54px', color: '#e3f2fd', fontStyle: '900'
    }).setOrigin(0.5);

    this.add.text(GAME_W/2, panel.y - 28, `Score: ${this.score}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '32px', color: '#b2ebf2'
    }).setOrigin(0.5);

    // Tombol Restart
    const btnR = this.add.rectangle(GAME_W/2 - 120, panel.y + 70, 200, 60, 0x22e3a3)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor: 'pointer' });
    this.add.text(btnR.x, btnR.y, 'Restart', {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', fontStyle: '800', color: '#061016'
    }).setOrigin(0.5);
    btnR.on('pointerup', () => this.scene.restart());

    // Tombol Share Twitter
    const btnS = this.add.rectangle(GAME_W/2 + 120, panel.y + 70, 200, 60, 0x1DA1F2)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor: 'pointer' });
    this.add.text(btnS.x, btnS.y, 'Share', {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', fontStyle: '800', color: '#ffffff'
    }).setOrigin(0.5);

    btnS.on('pointerup', () => {
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      const via  = 'Rialo'; // optional
      const intent = `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=${via}`;
      window.open(intent, '_blank');
    });
  }

  update(time, delta) {
    // Geser parallax pelan (px/frame)
    const dt = delta / 1000; // detik
    this.layers.forEach((layer, i) => {
      layer.tilePositionX += this.parallaxSpeed[i] * dt;
    });

    // Transisi animasi lompat -> ride saat mendarat
    if (!this.isGameOver) {
      const onGround = this.player.body.blocked.down || this.player.y >= this.groundY - 64;
      if (onGround && this.player.anims.currentAnim && this.player.anims.currentAnim.key === 'jump') {
        this.player.play('ride');
      }
    }

    // Kontrol keyboard
    if (this.cursors.space?.isDown || this.cursors.up?.isDown) {
      this.tryJump();
    }

    // Bersihkan obstacle di luar layar
    this.obstacles.children.iterate(o => {
      if (o && o.x < -100) o.destroy();
    });
  }
}

// ---------- Game Config ----------
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0f14',
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

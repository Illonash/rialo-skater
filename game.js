/* =========================================================
   RIALO SKATER — Parallax 6 layer (NO VERTICAL TILING)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

// Gameplay tuning
const BASE_SPEED      = 180;
const OBST_MIN_DELAY  = 1600;
const OBST_MAX_DELAY  = 2400;
const JUMP_VELOCITY   = -470;
const GRAVITY_Y       = 1400;
const MAX_LIVES       = 3;

// Visual layout
const SKY_COLOR       = 0x0b9bdc;         // warna langit (opsional, bisa pakai #0b9bdc)
const GROUND_Y        = GAME_H - 120;     // posisi garis lantai
const BAND_HEIGHT     = 320;              // tinggi “band kota” (city strip) sekali tampil

// Assets (samakan dengan repo-mu)
const ASSETS = {
  // 6 layer city yang sudah kamu upload (maps/city1..6.png)
  city: [
    'assets/maps/city/city1.png',
    'assets/maps/city/city2.png',
    'assets/maps/city/city3.png',
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png',
  ],
  // karakter 9 frame @128x128
  skater: 'assets/skater_girl.png',
  // obstacles
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/cone.png',
  ],
  // musik (opsional)
  bgm: 'assets/audio/bgm.mp3',
};

class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload() {
    ASSETS.city.forEach((p, i) => this.load.image(`city${i+1}`, p));
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });
    this.load.image('obs_barrier',  ASSETS.obstacles[0]);
    this.load.image('obs_cone',     ASSETS.obstacles[1]);
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    // ====== Background “langit” (solid) ======
    this.cameras.main.setBackgroundColor(SKY_COLOR);

    // ====== Parallax city (NO VERTICAL TILING) ======
    // Prinsip: tinggi tileSprite = BAND_HEIGHT dan tileScaleY diatur
    // sehingga exactly 1 tile tinggi (tidak ulang vertikal).
    this.cityLayers = [];
    const speeds = [6, 10, 14, 20, 28, 36]; // dari jauh ke dekat

    for (let i = 0; i < 6; i++) {
      const key = `city${i+1}`;
      const src = this.textures.get(key).getSourceImage();
      const texH = src.height;
      // scale agar tinggi final = BAND_HEIGHT (1x tile)
      const tileScaleY = BAND_HEIGHT / texH;

      const layer = this.add.tileSprite(
        0,                         // x anchor kiri
        GROUND_Y - BAND_HEIGHT,    // y: duduk tepat di atas ground
        GAME_W,                    // lebar area yang diisi
        BAND_HEIGHT,               // tinggi area (tepat 1 tile)
        key
      )
      .setOrigin(0, 0);

      // setTileScale: skala texture dalam tilespace
      layer.setTileScale(1, tileScaleY);

      // Simpan ke array + kecepatan parallax
      layer.__speed = speeds[i];
      this.cityLayers.push(layer);
    }

    // ====== (Opsional) garis ground untuk debug — comment kalau tak perlu ======
    // this.add.graphics().lineStyle(2, 0xffff00, 1).lineBetween(0, GROUND_Y, GAME_W, GROUND_Y);

    // ====== Player ======
    this.player = this.physics.add.sprite(200, GROUND_Y - 66, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    // Hitbox kecil biar fair
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animasi
    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0  });
    this.anims.create({ key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });

    this.player.play('ride');

    // Kontrol
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // ====== Musik (aman kalau file tak ada) ======
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 });
        this.bgm.play();
      }
    } catch(_) {}

    // ====== HUD ======
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16,16, 'Score: 0', { fontFamily:'system-ui', fontSize:'28px', color:'#ffffff' });

    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 28 - i*28, 16, '❤', { fontSize:'28px' }).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    // ====== Obstacles ======
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
    this.scheduleNextObstacle();

    // Score tick
    this.time.addEvent({ delay:150, loop:true, callback: () => {
      this.score++;
      this.scoreText.setText(`Score: ${this.score}`);
    }});

    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  // ---------- Spawner ----------
  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    const key = Phaser.Math.Between(0,1) === 0 ? 'obs_barrier' : 'obs_cone';
    const obj = this.obstacles.create(GAME_W + 60, GROUND_Y, key)
      .setOrigin(0.5, 1);                 // tapak obstacle tepat di ground
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setVelocityX(-BASE_SPEED);

    // spawn berikutnya
    this.scheduleNextObstacle();
  }

  // ---------- Control ----------
  tryJump() {
    if (this.isGameOver) return;
    const onGround = (this.player.body.blocked.down || this.player.y >= GROUND_Y - 66);
    if (onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
    }
  }

  // ---------- Collision ----------
  onHit = (player, obstacle) => {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives--;
    this.updateHearts();

    player.play('crash', true);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(220, () => player.play('ride'));

    if (this.lives <= 0) {
      this.gameOver();
    }
  };

  updateHearts() {
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver() {
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.setVelocityX(0);
    if (this.bgm) this.bgm.stop();
  }

  // ---------- Main update ----------
  update(_, delta) {
    const dt = delta / 1000;

    // Parallax geser halus — HANYA 1 band city (tidak double)
    this.cityLayers.forEach(layer => {
      layer.tilePositionX += layer.__speed * dt;
    });

    // Transisi anim lompat -> ride saat sudah mendarat
    if (!this.isGameOver) {
      const onGround = (this.player.body.blocked.down || this.player.y >= GROUND_Y - 66);
      if (onGround && this.player.anims.currentAnim?.key === 'jump') {
        this.player.play('ride');
      }
    }

    // keyboard jump
    if (this.cursors.space?.isDown || this.cursors.up?.isDown) this.tryJump();

    // bersihkan obstacle di luar layar
    this.obstacles.children.iterate(o => { if (o && o.x < -120) o.destroy(); });
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b9bdc', // sama dengan SKY_COLOR
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [GameScene],
};

new Phaser.Game(config);

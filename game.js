/* =========================================================
   RIALO SKATER — Splash → Preview → Game (fixed layout)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

/* -------- Gameplay tuning -------- */
const BASE_SPEED      = 180;
const OBST_MIN_DELAY  = 1600;
const OBST_MAX_DELAY  = 2400;
const JUMP_VELOCITY   = -470;
const GRAVITY_Y       = 1400;
const MAX_LIVES       = 3;

/* -------- Visual layout --------
   Naikkan ground + perbesar band city agar tidak terlihat kecil
*/
const SKY_COLOR       = 0x0b9bdc;
const GROUND_Y        = GAME_H - 160;   // ← ground naik (dulu -120)
const BAND_HEIGHT     = 440;            // ← band kota lebih tinggi (dulu 320)

/* -------- Assets (samakan path repo) -------- */
const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',

  city: [
    'assets/maps/city/city1.png',
    'assets/maps/city/city2.png',
    'assets/maps/city/city3.png',
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png',
  ],

  skater: 'assets/skater_girl.png',   // 9 frames @128x128
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/cone.png',
  ],
  bgm: 'assets/audio/bgm.mp3',        // optional
};

/* =========================================================
   Splash Scene
   ========================================================= */
class SplashScene extends Phaser.Scene {
  constructor(){ super('SplashScene'); }

  preload() {
    this.load.image('splashBg', ASSETS.splash);
  }

  create() {
    // background splash full cover
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(s);

    // PLAY button
    const btn = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f)
      .setInteractive({ cursor: 'pointer' });
    this.add.text(btn.x, btn.y, 'PLAY', {
      fontFamily:'system-ui, sans-serif', fontSize:'36px', fontStyle:'900', color:'#1b1b1b'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('PreviewScene'));

    // Powered by Rialo
    this.add.text(GAME_W/2, GAME_H-28, 'Powered by Rialo', {
      fontFamily:'system-ui, sans-serif', fontSize:'18px', color:'#cfd8dc'
    }).setOrigin(0.5);
  }
}

/* =========================================================
   Preview Scene
   ========================================================= */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }

  preload() {
    this.load.image('mapPreview',  ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1316');

    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily:'system-ui, sans-serif', fontSize:'36px', color:'#b2ebf2'
    }).setOrigin(0.5);

    // panel map
    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y - mapPanel.height/2 - 28, 'Map', {
      fontFamily:'system-ui, sans-serif', fontSize:'28px', color:'#80deea'
    }).setOrigin(0.5);

    // panel character
    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y - charPanel.height/2 - 28, 'Character', {
      fontFamily:'system-ui, sans-serif', fontSize:'28px', color:'#80deea'
    }).setOrigin(0.5);

    // SKATE
    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12)
      .setInteractive({ cursor: 'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily:'system-ui, sans-serif', fontSize:'36px', fontStyle:'900', color:'#0a0f12'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('GameScene'));

    // Back
    const back = this.add.text(24,24,'← Back',{ fontFamily:'system-ui', fontSize:'20px', color:'#90caf9' })
      .setInteractive({ cursor:'pointer' });
    back.on('pointerup', () => this.scene.start('SplashScene'));
  }
}

/* =========================================================
   Game Scene
   ========================================================= */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload() {
    // city layers
    ASSETS.city.forEach((p,i)=> this.load.image(`city${i+1}`, p));

    // player
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });

    // obstacles
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_cone',    ASSETS.obstacles[1]);

    // music (safe if missing)
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    /* ---------- Background sky ---------- */
    this.cameras.main.setBackgroundColor(SKY_COLOR);

    /* ---------- Single-band City Parallax (NO vertical tiling) ---------- */
    this.cityLayers = [];
    const speeds = [6, 10, 14, 20, 28, 36];

    for (let i = 0; i < 6; i++) {
      const key = `city${i+1}`;
      const src = this.textures.get(key).getSourceImage();
      const texH = src.height;
      const tileScaleY = BAND_HEIGHT / texH;   // 1 tile pas setinggi band

      const layer = this.add.tileSprite(
        0,                         // x kiri
        GROUND_Y - BAND_HEIGHT,    // y band duduk di atas ground
        GAME_W,                    // lebar terlihat
        BAND_HEIGHT,               // tinggi band
        key
      ).setOrigin(0,0);

      layer.setTileScale(1, tileScaleY);
      layer.__speed = speeds[i];
      this.cityLayers.push(layer);
    }

    /* ---------- Player ---------- */
    // posisikan lebih naik dari ground (~72 px tinggi setengah sprite)
    this.player = this.physics.add.sprite(220, GROUND_Y - 72, 'skater', 1);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    // hitbox lebih kecil
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // anims
    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0  });
    this.anims.create({ key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });
    this.player.play('ride');

    // control
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    /* ---------- HUD ---------- */
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontFamily:'system-ui', fontSize:'28px', color:'#ffffff'
    });

    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add.text(GAME_W - 28 - i*28, 16, '❤', { fontSize:'28px' })
        .setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    /* ---------- Obstacles ---------- */
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
    this.scheduleNextObstacle();

    /* ---------- Score tick ---------- */
    this.time.addEvent({
      delay:150, loop:true, callback:() => {
        this.score++; this.scoreText.setText(`Score: ${this.score}`);
      }
    });

    /* ---------- Music (safe) ---------- */
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 }); this.bgm.play();
      }
    } catch(_) {}

    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  scheduleNextObstacle() {
    const d = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(d, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const key = Phaser.Math.Between(0,1) === 0 ? 'obs_barrier' : 'obs_cone';

    // dudukkan tepat di ground
    const obj = this.obstacles.create(GAME_W + 60, GROUND_Y, key).setOrigin(0.5, 1);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setVelocityX(-BASE_SPEED);

    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;
    const onGround = (this.player.body.blocked.down || this.player.y >= GROUND_Y - 72);
    if (onGround) { this.player.setVelocityY(JUMP_VELOCITY); this.player.play('jump', true); }
  }

  onHit = () => {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives--; this.updateHearts();
    this.player.play('crash', true);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(220, () => this.player.play('ride'));
    if (this.lives <= 0) this.gameOver();
  };

  updateHearts(){ this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25)); }

  gameOver(){
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.setVelocityX(0);
    if (this.bgm) this.bgm.stop();
  }

  update(_, delta){
    const dt = delta/1000;

    // parallax halus (1 band city; tidak double)
    this.cityLayers.forEach(l => l.tilePositionX += l.__speed * dt);

    if (!this.isGameOver) {
      const onGround = (this.player.body.blocked.down || this.player.y >= GROUND_Y - 72);
      if (onGround && this.player.anims.currentAnim?.key === 'jump') this.player.play('ride');
    }

    if (this.cursors.space?.isDown || this.cursors.up?.isDown) this.tryJump();
    this.obstacles.children.iterate(o => { if (o && o.x < -120) o.destroy(); });
  }
}

/* =========================================================
   Game Config
   ========================================================= */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b9bdc',
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],   // ← Splash & Preview balik lagi
};

new Phaser.Game(config);

/* =========================================================
   RIALO SKATER — Splash -> Preview -> Game
   Fokus update: FOOT OFFSET (player & obstacle)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

/* ----------------- TUNABLES ----------------- */
// Kecepatan dasar & fisika
const BASE_SPEED        = 190;
const PARALLAX_SPEEDS   = [12, 18, 26, 34]; // makin kanan makin cepat
const GRAVITY_Y         = 1500;
const JUMP_VELOCITY     = -520;
const MAX_LIVES         = 3;

// Double jump
const MAX_JUMPS         = 2;

// Spawning obstacle
const OBST_MIN_DELAY    = 1400;
const OBST_MAX_DELAY    = 2200;
const OBST_SPEED        = BASE_SPEED;

// Ground (garis lari) di ~58% layar dari atas
const GROUND_Y_FRACTION = 0.58;

// === OFFSET KAKI (inti perbaikan visual tenggelam/terbang) ===
const FOOT_OFFSET_PLAYER = 18;  // angkat player dari ground line (px)
const FOOT_OFFSET_OBS    = 6;   // angkat obstacle sedikit dari ground line (px)

/* -------------- ASSET PATHS (sesuaikan) -------------- */
const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater:      'assets/skater_girl.png', // 1152x128 (9 frame @128)
  // Parallax (pakai 4 layer saja agar rapi & ringan)
  city: [
    'assets/maps/city/city3.png', // jauh
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png', // dekat
  ],
  obstacles: [
    'assets/obstacles/cone.png',
    'assets/obstacles/barrier.png',
    'assets/obstacles/barrier2.png',
  ],
  bgm: 'assets/audio/bgm.mp3'
};

/* ================== Splash ================== */
class SplashScene extends Phaser.Scene {
  constructor(){ super('SplashScene'); }
  preload(){
    this.load.image('splashBg', ASSETS.splash);
    this.load.image('mapPreview', ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create(){
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(s);

    const btn = this.add.rectangle(GAME_W/2, GAME_H/2 + 130, 300, 80, 0xF9C315)
      .setStrokeStyle(6, 0x1c1c1c).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'PLAY', {fontFamily:'system-ui',fontSize:38,color:'#101010',fontStyle:'900'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('PreviewScene'));

    this.add.text(GAME_W/2, GAME_H-26, 'Powered by Rialo', {fontFamily:'system-ui',fontSize:18,color:'#dfe8ef'}).setOrigin(0.5);
  }
}

/* ================== Preview ================== */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }
  create(){
    this.cameras.main.setBackgroundColor('#0b0f14');

    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily:'system-ui', fontSize:36, color:'#b2ebf2'
    }).setOrigin(0.5);

    const left = this.add.rectangle(380, 340, 520, 320, 0x10151b, 0.96).setStrokeStyle(4, 0x23d3bd);
    this.add.image(left.x, left.y, 'mapPreview').setScale(0.75);
    this.add.text(left.x, left.y - 190, 'Map', {fontFamily:'system-ui',fontSize:26,color:'#8be9f1'}).setOrigin(0.5);

    const right = this.add.rectangle(900, 340, 520, 320, 0x10151b, 0.96).setStrokeStyle(4, 0x23d3bd);
    this.add.image(right.x, right.y, 'charPreview').setScale(1.0);
    this.add.text(right.x, right.y - 190, 'Character', {fontFamily:'system-ui',fontSize:26,color:'#8be9f1'}).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W/2, GAME_H-90, 280, 78, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'SKATE!', {fontFamily:'system-ui',fontSize:36,fontStyle:'900',color:'#0a0f12'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('GameScene'));

    const back = this.add.text(22, 22, '← Back', {fontFamily:'system-ui',fontSize:20,color:'#90caf9'})
      .setInteractive({cursor:'pointer'});
    back.on('pointerup', ()=> this.scene.start('SplashScene'));
  }
}

/* ================== Game ================== */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload(){
    // Parallax layers
    ASSETS.city.forEach((p,i)=> this.load.image(`city${i}`, p));

    // Obstacles
    this.load.image('obs_cone',     ASSETS.obstacles[0]);
    this.load.image('obs_barrier',  ASSETS.obstacles[1]);
    this.load.image('obs_barrier2', ASSETS.obstacles[2]);

    // Player
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });

    // Audio
    this.load.audio('bgm', ASSETS.bgm);
  }

  create(){
    /* ---------- world & ground line ---------- */
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
    this.groundY = Math.round(GAME_H * GROUND_Y_FRACTION);

    /* ---------- parallax background (full layar, 1 baris) ---------- */
    this.layers = [
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city0').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city1').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city2').setOrigin(0,0),
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city3').setOrigin(0,0)
    ];

    /* ---------- ground (invisible collider) ---------- */
    this.ground = this.add.rectangle(0, this.groundY, GAME_W, 8, 0x000000, 0).setOrigin(0,0.5);
    this.physics.add.existing(this.ground, true);

    /* ---------- player ---------- */
    const PLAYER_X = 180;
    this.player = this.physics.add.sprite(PLAYER_X, this.groundY - FOOT_OFFSET_PLAYER, 'skater', 1)
      .setOrigin(0.5, 1);
    this.player.setGravityY(GRAVITY_Y);
    this.player.setCollideWorldBounds(true);
    // hitbox lebih kecil
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // animasi
    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12 });
    this.anims.create({ key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });

    this.player.play('ride');

    // collider player ↔ ground agar body.blocked.down bekerja
    this.physics.add.collider(this.player, this.ground, () => {
      // jaga agar y tepat di garis ground visual + offset
      this.player.setY(this.groundY - FOOT_OFFSET_PLAYER);
      if (!this.isGameOver && this.player.anims.currentAnim?.key === 'jump') {
        this.player.play('ride');
      }
      this.jumpCount = 0; // reset counter untuk double-jump
    });

    /* ---------- controls ---------- */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => this.tryJump());
    this.input.on('pointerdown', () => this.tryJump());

    /* ---------- UI ---------- */
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(24, 22, 'Score: 0', {fontFamily:'system-ui', fontSize:36, color:'#ffffff'});
    this.hearts = [];
    for (let i=0;i<MAX_LIVES;i++){
      const t = this.add.text(GAME_W - 20 - i*36, 22, '❤', {fontSize:36}).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(t);
    }

    /* ---------- obstacles ---------- */
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);
    this.scheduleNextObstacle();

    /* ---------- audio ---------- */
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 });
        this.bgm.play();
      }
    } catch {}

    /* ---------- state ---------- */
    this.isGameOver = false;
    this.invulnUntil = 0;
    this.jumpCount = 0;

    // Score timer
    this.time.addEvent({ delay:160, loop:true, callback:()=> {
      if (!this.isGameOver){ this.score++; this.scoreText.setText('Score: '+this.score); }
    }});
  }

  /* ---------- helpers ---------- */
  isOnGround(){
    // gunakan posisi + velY agar stabil
    return (this.player.body.blocked.down || (this.player.y >= this.groundY - FOOT_OFFSET_PLAYER - 0.5 && this.player.body.velocity.y >= 0));
  }

  tryJump(){
    if (this.isGameOver) return;

    // izinkan double jump
    if (this.isOnGround()) {
      this.jumpCount = 0;
    }
    if (this.jumpCount < MAX_JUMPS){
      // “snap” ke ground line lebih dulu supaya konsisten
      if (this.isOnGround()) this.player.setY(this.groundY - FOOT_OFFSET_PLAYER);

      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
      this.jumpCount++;
    }
  }

  scheduleNextObstacle(){
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle(){
    if (this.isGameOver) return;

    const keys = ['obs_cone','obs_barrier','obs_barrier2'];
    const key  = Phaser.Utils.Array.GetRandom(keys);

    // posisikan persis di ground line + offset obstacle
    const o = this.obstacles.create(GAME_W + 48, this.groundY - FOOT_OFFSET_OBS, key)
      .setOrigin(0.5, 1);
    o.setImmovable(true);
    o.body.allowGravity = false;

    // skala sedikit kecil biar fair
    o.setScale(0.9);
    // hitbox wajar (70% lebar, 65% tinggi) & offset sedikit
    o.body.setSize(o.width*0.70, o.height*0.65).setOffset(o.width*0.15, o.height*0.35);

    // bergerak ke kiri
    o.setVelocityX(-OBST_SPEED);

    // auto cleanup
    o.checkWorldBounds = true;
    o.outOfBoundsKill = true;

    // jadwalkan berikutnya
    this.scheduleNextObstacle();
  }

  handleHit(player, obstacle){
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives--;
    this.updateHearts();

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 900;
    this.time.delayedCall(220, ()=> player.clearTint());
    this.time.delayedCall(260, ()=> { if(!this.isGameOver) player.play('ride'); });

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  updateHearts(){
    this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver(){
    if (this.isGameOver) return;
    this.isGameOver = true;

    // hentikan semuanya
    this.obstacles.children.iterate(o=> o && o.setVelocityX(0));
    if (this.bgm) this.bgm.stop();
    this.player.play('crash');
    this.player.setVelocity(0,0);

    // panel
    const dim   = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.6).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 640, 320, 0x0d1726, 0.96).setStrokeStyle(6,0x22e3a3);
    this.add.text(GAME_W/2, panel.y - 96, 'Game Over', {fontFamily:'system-ui', fontSize:56, color:'#e3f2fd', fontStyle:'900'}).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y - 30, `Score: ${this.score}`, {fontFamily:'system-ui', fontSize:30, color:'#b2ebf2'}).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2 - 120, panel.y + 70, 200, 60, 0x22e3a3).setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnR.x, btnR.y, 'Restart', {fontFamily:'system-ui', fontSize:24, fontStyle:'800', color:'#061016'}).setOrigin(0.5);
    btnR.on('pointerup', ()=> this.scene.restart()); // restart total: obstacles akan di-spawn lagi normal

    const btnS = this.add.rectangle(GAME_W/2 + 120, panel.y + 70, 200, 60, 0x1DA1F2).setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnS.x, btnS.y, 'Share', {fontFamily:'system-ui', fontSize:24, fontStyle:'800', color:'#ffffff'}).setOrigin(0.5);
    btnS.on('pointerup', ()=>{
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(time, delta){
    // parallax geser halus
    const dt = delta / 1000;
    this.layers.forEach((L,i)=> { L.tilePositionX += PARALLAX_SPEEDS[i]*dt; });

    // bersihkan obstacle yang sudah lewat
    this.obstacles.children.iterate(o=> { if (o && o.x < -120) o.destroy(); });

    // jaga player tetap “menempel” ground (visual) saat sudah mendarat
    if (this.isOnGround()){
      this.player.setY(this.groundY - FOOT_OFFSET_PLAYER);
    }
  }
}

/* ================== Boot ================== */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-root',
  backgroundColor: '#0b0f14',
  physics: {
    default: 'arcade',
    arcade: { debug:false, gravity: { y:0 } } // kita beri gravity langsung ke player
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene]
};

new Phaser.Game(config);

/* =========================================================
   RIALO SKATER — Solid build: no double BG, clean ground
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

// ---- tuning
const BAND_H        = 340;  // tinggi “band” kota di bagian bawah
const GROUND_THICK  = 12;   // garis tipis ground (opsional)
const BASE_SPEED    = 180;
const OBST_MIN_MS   = 1600;
const OBST_MAX_MS   = 2400;
const JUMP_VELO     = -470;
const GRAVITY_Y     = 1400;
const MAX_LIVES     = 3;

const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater:      'assets/skater_girl.png',
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

/* ---------------- Splash ---------------- */
class SplashScene extends Phaser.Scene {
  constructor(){ super('SplashScene'); }
  preload(){
    this.load.image('splashBg',   ASSETS.splash);
    this.load.image('mapPreview', ASSETS.mapPreview);
    this.load.image('charPreview',ASSETS.charPreview);
  }
  create(){
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    bg.setScale(Math.max(GAME_W/bg.width, GAME_H/bg.height));

    const play = this.add.rectangle(GAME_W/2, GAME_H/2+120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({cursor:'pointer'});
    this.add.text(play.x, play.y, 'PLAY', {fontFamily:'system-ui', fontSize:'36px', fontStyle:'900', color:'#1b1b1b'}).setOrigin(0.5);
    play.on('pointerup', ()=> this.scene.start('PreviewScene'));

    this.add.text(GAME_W/2, GAME_H-28, 'Powered by Rialo', {fontFamily:'system-ui', fontSize:'18px', color:'#cfd8dc'}).setOrigin(0.5);
  }
}

/* ---------------- Preview ---------------- */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }
  create(){
    this.cameras.main.setBackgroundColor('#0f1316');
    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {fontFamily:'system-ui', fontSize:'36px', color:'#b2ebf2'}).setOrigin(0.5);

    this.add.image(380, 340, 'mapPreview').setScale(0.65);
    this.add.image(900, 340, 'charPreview').setScale(0.9);

    const btn = this.add.rectangle(GAME_W/2, GAME_H-90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'SKATE!', {fontFamily:'system-ui', fontSize:'36px', fontStyle:'900', color:'#0a0f12'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('GameScene'));

    this.add.text(24,24,'← Back',{fontSize:'20px',color:'#90caf9'}).setInteractive({cursor:'pointer'})
      .on('pointerup', ()=> this.scene.start('SplashScene'));
  }
}

/* ---------------- Game ---------------- */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload(){
    ASSETS.city.forEach((p,i)=> this.load.image(`city${i+1}`, p));
    this.load.image('obs_barrier',  ASSETS.obstacles[0]);
    this.load.image('obs_barrier2', ASSETS.obstacles[1]);
    this.load.image('obs_cone',     ASSETS.obstacles[2]);
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });
    this.load.audio('bgm', ASSETS.bgm);
  }

  create(){
    /* ---- music (best-effort) ---- */
    try { if (this.cache.audio.exists('bgm')) {
      this.bgm = this.sound.add('bgm',{loop:true, volume:0.35}); this.bgm.play();
    }} catch(_){}

    /* ---- ground & parallax ---- */
    this.groundY = GAME_H - GROUND_THICK;     // garis dasar
    const bandTop = GAME_H - BAND_H;          // top posisi band

    // buat 6 layer “band” menempel bawah (origin 0,1) & set tinggi ke BAND_H
    this.layers = ASSETS.city.map((_,i)=>{
      const t = this.add.tileSprite(0, GAME_H, GAME_W, BAND_H, `city${i+1}`).setOrigin(0,1);
      return t;
    });
    // kecepatan pelan & bertingkat
    this.parallaxSpeed = [6, 10, 14, 20, 28, 36];

    // garis ground tipis (opsional)
    this.add.rectangle(0, this.groundY, GAME_W, GROUND_THICK, 0x1177bb).setOrigin(0,1).setAlpha(0.25);

    /* ---- physics & player ---- */
    this.physics.world.setBounds(0,0,GAME_W,GAME_H);
    this.player = this.physics.add.sprite(160, this.groundY - 68, 'skater', 1);
    this.player.setGravityY(GRAVITY_Y).setCollideWorldBounds(true);
    // hitbox lebih fair
    this.player.body.setSize(60,80).setOffset(34,36);

    this.anims.create({key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1});
    this.anims.create({key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12});
    this.anims.create({key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1});
    this.anims.create({key:'crash', frames:[{key:'skater',frame:8}], frameRate:1});
    this.player.play('ride');

    /* ---- input (double jump) ---- */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', ()=> this.tryJump());
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump());
    this.input.keyboard.on('keydown-UP',    ()=> this.tryJump());

    /* ---- UI ---- */
    this.score = 0; this.lives = MAX_LIVES; this.jumpsLeft = 2;
    this.scoreText = this.add.text(16,18,'Score: 0',{fontSize:'32px',color:'#ffffff'});
    this.hearts = [];
    for (let i=0;i<MAX_LIVES;i++){
      this.hearts.push(this.add.text(GAME_W-28-i*28,18,'❤',{fontSize:'28px'}).setTint(0xff6b81).setOrigin(1,0));
    }

    /* ---- obstacles ---- */
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);

    this.isGameOver = false;
    this.invulnUntil = 0;

    this.scoreTimer = this.time.addEvent({
      delay: 150, loop: true,
      callback: ()=>{ if (!this.isGameOver){ this.score++; this.scoreText.setText(`Score: ${this.score}`); } }
    });

    this.scheduleNextObstacle();
  }

  /* ---------- obstacles ---------- */
  scheduleNextObstacle(){
    if (this.isGameOver) return;
    const d = Phaser.Math.Between(OBST_MIN_MS, OBST_MAX_MS);
    this.spawnTimer = this.time.delayedCall(d, ()=> this.spawnObstacle());
  }

  spawnObstacle(){
    if (this.isGameOver) return;
    const keys = ['obs_barrier','obs_barrier2','obs_cone'];
    const key  = Phaser.Utils.Array.GetRandom(keys);

    const o = this.obstacles.create(GAME_W + 40, this.groundY, key);
    o.setOrigin(0.5,1);
    o.body.allowGravity = false;
    o.setImmovable(true);
    o.setScale(0.80);                    // perkecil
    o.setVelocityX(-BASE_SPEED);

    this.scheduleNextObstacle();
  }

  /* ---------- jump (double) ---------- */
  tryJump(){
    if (this.isGameOver) return;

    // reset stok lompat saat menyentuh ground
    if (this.player.body.blocked.down || this.player.y >= this.groundY - 68){
      this.jumpsLeft = 2;
    }
    if (this.jumpsLeft > 0){
      this.player.setVelocityY(JUMP_VELO);
      this.player.play('jump', true);
      this.jumpsLeft--;
    }
  }

  /* ---------- collision ---------- */
  onHit(){
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives--; this.updateHearts();

    this.player.play('crash', true).setTint(0xff9090);
    this.invulnUntil = now + 900;
    this.time.delayedCall(180, ()=> this.player.clearTint());
    this.time.delayedCall(220, ()=> this.player.play('ride'));

    if (this.lives <= 0){ this.gameOver(); }
  }

  updateHearts(){ this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25)); }

  /* ---------- game over ---------- */
  gameOver(){
    this.isGameOver = true;

    // stop semuanya
    this.player.play('crash');
    this.player.body.setVelocity(0,0);
    this.player.body.allowGravity = false;
    this.obstacles.children.iterate(o=> o && o.setVelocityX(0));
    if (this.bgm) this.bgm.stop();
    if (this.spawnTimer) this.spawnTimer.remove(false);
    if (this.scoreTimer) this.scoreTimer.paused = true;

    // overlay
    this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.60).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 640, 320, 0x0f172a, 0.95).setStrokeStyle(6,0x22e3a3);
    this.add.text(GAME_W/2, panel.y-100, 'Game Over', {fontSize:'56px', fontStyle:'900', color:'#e3f2fd'}).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y-30, `Score: ${this.score}`, {fontSize:'32px', color:'#b2ebf2'}).setOrigin(0.5);

    const btnR = this.add.text(GAME_W/2-110, panel.y+80, '[ RESTART ]', {fontSize:'26px', color:'#22e3a3'})
      .setOrigin(0.5).setInteractive({cursor:'pointer'})
      .on('pointerup', ()=> this.scene.restart());

    const btnS = this.add.text(GAME_W/2+120, panel.y+80, '[ SHARE ]', {fontSize:'26px', color:'#1DA1F2'})
      .setOrigin(0.5).setInteractive({cursor:'pointer'})
      .on('pointerup', ()=>{
        const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
        const url  = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
      });

    // keyboard cepat: R untuk restart
    this.input.keyboard.once('keydown-R', ()=> this.scene.restart());
  }

  /* ---------- loop ---------- */
  update(_, delta){
    if (this.isGameOver) return;

    // gerak parallax
    const dt = delta/1000;
    this.layers.forEach((layer,i)=> layer.tilePositionX += this.parallaxSpeed[i]*dt);

    // kalau selesai anim lompat & nyentuh ground → balik ride
    if ((this.player.body.blocked.down || this.player.y >= this.groundY - 68)
        && this.player.anims.currentAnim?.key === 'jump'){
      this.player.play('ride');
    }

    // bersihkan obstacle yang sudah lewat
    this.obstacles.children.iterate(o=> { if (o && o.x < -120) o.destroy(); });
  }
}

/* ---------- config ---------- */
const config = {
  type: Phaser.AUTO,
  width: GAME_W, height: GAME_H,
  parent: 'game-root',
  backgroundColor: '#0b0f14',
  physics: { default:'arcade', arcade:{ debug:false, gravity:{ y:0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

/* =========================================================
   RIALO SKATER — Splash → Preview → Game (fix pack 2)
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
const MAX_JUMPS       = 2;     // ← double jump

/* -------- Visual layout -------- */
const SKY_COLOR       = 0x0b9bdc;
const GROUND_Y        = GAME_H - 150;  // lantai visual (semakin kecil → semakin ke bawah)
const BAND_HEIGHT     = 440;           // tinggi band kota (satu strip saja)

/* -------- Obstacle look -------- */
const OBST_SCALE      = 0.85; // ← perkecil obstacle
const OBST_FLOOR_NUDGE = 4;   // ← “tenggelamkan” 4px ke lantai supaya tidak terlihat melayang

/* -------- Assets (samakan dengan repo) -------- */
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
  skater: 'assets/skater_girl.png', // 9 frames @128x128
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/cone.png',
  ],
  bgm: 'assets/audio/bgm.mp3', // optional
};

/* =========================================================
   Splash
   ========================================================= */
class SplashScene extends Phaser.Scene {
  constructor(){ super('SplashScene'); }
  preload(){ this.load.image('splashBg', ASSETS.splash); }
  create(){
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height); bg.setScale(s);

    const btn = this.add.rectangle(GAME_W/2, GAME_H/2+120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'PLAY', {fontFamily:'system-ui', fontSize:'36px', fontStyle:'900', color:'#1b1b1b'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('PreviewScene'));

    this.add.text(GAME_W/2, GAME_H-28, 'Powered by Rialo', {fontFamily:'system-ui', fontSize:'18px', color:'#cfd8dc'}).setOrigin(0.5);
  }
}

/* =========================================================
   Preview
   ========================================================= */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }
  preload(){
    this.load.image('mapPreview',  ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create(){
    this.cameras.main.setBackgroundColor('#0f1316');
    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {fontFamily:'system-ui', fontSize:'36px', color:'#b2ebf2'}).setOrigin(0.5);

    const mp = this.add.rectangle(380, 340, 520, 320, 0x121820, .96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mp.x, mp.y, 'mapPreview').setScale(0.65);
    this.add.text(mp.x, mp.y-mp.height/2-28, 'Map', {fontFamily:'system-ui', fontSize:'28px', color:'#80deea'}).setOrigin(0.5);

    const cp = this.add.rectangle(900, 340, 520, 320, 0x121820, .96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(cp.x, cp.y, 'charPreview').setScale(0.9);
    this.add.text(cp.x, cp.y-cp.height/2-28, 'Character', {fontFamily:'system-ui', fontSize:'28px', color:'#80deea'}).setOrigin(0.5);

    const go = this.add.rectangle(GAME_W/2, GAME_H-90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({cursor:'pointer'});
    this.add.text(go.x, go.y, 'SKATE!', {fontFamily:'system-ui', fontSize:'36px', fontStyle:'900', color:'#0a0f12'}).setOrigin(0.5);
    go.on('pointerup', ()=> this.scene.start('GameScene'));

    const back = this.add.text(24,24,'← Back',{fontFamily:'system-ui', fontSize:'20px', color:'#90caf9'}).setInteractive({cursor:'pointer'});
    back.on('pointerup', ()=> this.scene.start('SplashScene'));
  }
}

/* =========================================================
   Game
   ========================================================= */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }
  preload(){
    ASSETS.city.forEach((p,i)=> this.load.image(`city${i+1}`, p));
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_cone',    ASSETS.obstacles[1]);
    this.load.audio('bgm', ASSETS.bgm);
  }

  create(){
    // pastikan semua timer dari sesi sebelumnya dibersihkan
    this.time.removeAllEvents();
    this.events.once('shutdown', ()=> this.time.removeAllEvents());

    this.cameras.main.setBackgroundColor(SKY_COLOR);

    /* --- satu band city, tidak tile ke bawah --- */
    this.cityLayers = [];
    const speeds = [6,10,14,20,28,36];
    for (let i=0;i<6;i++){
      const key = `city${i+1}`;
      const src = this.textures.get(key).getSourceImage();
      const scaleY = BAND_HEIGHT / src.height;

      const layer = this.add.tileSprite(
        0, GROUND_Y - BAND_HEIGHT, GAME_W, BAND_HEIGHT, key
      ).setOrigin(0,0);
      layer.setTileScale(1, scaleY);
      layer.__speed = speeds[i];
      this.cityLayers.push(layer);
    }

    /* --- player di atas lantai, sejajar obstacle --- */
    this.player = this.physics.add.sprite(220, GROUND_Y - 64, 'skater', 1);
    this.player.setDepth(10).setGravityY(GRAVITY_Y).setCollideWorldBounds(true);
    this.player.body.setSize(60,80).setOffset(34,36);

    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0  });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });
    this.player.play('ride');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', ()=> this.tryJump());

    /* --- HUD --- */
    this.score = 0; this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16,16,'Score: 0',{fontFamily:'system-ui', fontSize:'28px', color:'#fff'});
    this.hearts = [];
    for (let i=0;i<MAX_LIVES;i++){
      const h = this.add.text(GAME_W-28-i*28,16,'❤',{fontSize:'28px'}).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    /* --- obstacles --- */
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);

    /* --- score timer & spawn pertama --- */
    this.time.addEvent({ delay:150, loop:true, callback:()=>{ this.score++; this.scoreText.setText(`Score: ${this.score}`);} });
    this.scheduleNextObstacle();

    /* --- music (safe) --- */
    try{ if(this.cache.audio.exists('bgm')){ this.bgm=this.sound.add('bgm',{loop:true,volume:.35}); this.bgm.play(); } }catch(_){}

    this.isGameOver = false; this.invulnUntil = 0;
    this.jumpCount  = 0; // ← reset counter lompat
  }

  /* ---------- helpers ---------- */
  scheduleNextObstacle(){
    if (this.isGameOver) return;
    const d = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(d, ()=> this.spawnObstacle());
  }

  spawnObstacle(){
    if (this.isGameOver) return;

    const key = Phaser.Math.Between(0,1) ? 'obs_barrier' : 'obs_cone';

    // spawn di lantai; origin bawah; sedikit “nudge” agar menempel lantai
    const obj = this.obstacles.create(GAME_W + 60, GROUND_Y + OBST_FLOOR_NUDGE, key)
      .setOrigin(0.5, 1)
      .setScale(OBST_SCALE);

    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setVelocityX(-BASE_SPEED);

    // sesuaikan hitbox setelah scaling (pakai display size)
    obj.body.setSize(obj.displayWidth * 0.7, obj.displayHeight * 0.8, true);

    this.scheduleNextObstacle();
  }

  tryJump(){
    if (this.isGameOver) return;

    const onGround = (this.player.y >= GROUND_Y - 64 - 1);
    if (onGround) this.jumpCount = 0;

    if (this.jumpCount < MAX_JUMPS){
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
      this.jumpCount += 1;
    }
  }

  onHit = () => {
    const now = this.time.now; if (now < this.invulnUntil || this.isGameOver) return;
    this.lives--; this.updateHearts();
    this.player.play('crash', true);
    this.invulnUntil = now + 900;
    this.time.delayedCall(220, ()=> this.player.play('ride'));
    if (this.lives <= 0) this.gameOver();
  };

  updateHearts(){ this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25)); }

  clampToGround(){
    // cegah player “tembus” di bawah lantai visual
    if (this.player.y > GROUND_Y - 64){
      this.player.y = GROUND_Y - 64;
      if (this.player.body.velocity.y > 0) this.player.setVelocityY(0);
    }
  }

  gameOver(){
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.setVelocityX(0);
    if (this.bgm) this.bgm.stop();

    const dim = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.55).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 640, 320, 0x0f172a, 0.95).setStrokeStyle(6, 0x22e3a3);

    this.add.text(GAME_W/2, panel.y-96, 'Game Over', {fontFamily:'system-ui', fontSize:'56px', color:'#e3f2fd', fontStyle:'900'}).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y-28, `Score: ${this.score}`, {fontFamily:'system-ui', fontSize:'32px', color:'#b2ebf2'}).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2-120, panel.y+70, 200, 60, 0x22e3a3)
      .setStrokeStyle(4, 0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnR.x, btnR.y, 'Restart', {fontFamily:'system-ui', fontSize:'26px', fontStyle:'800', color:'#061016'}).setOrigin(0.5);
    btnR.on('pointerup', ()=> this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2+120, panel.y+70, 200, 60, 0x1DA1F2)
      .setStrokeStyle(4, 0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnS.x, btnS.y, 'Share', {fontFamily:'system-ui', fontSize:'26px', fontStyle:'800', color:'#ffffff'}).setOrigin(0.5);
    btnS.on('pointerup', ()=>{
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(_, dt){
    const t = dt/1000;
    this.cityLayers.forEach(l => l.tilePositionX += l.__speed * t);

    if (!this.isGameOver){
      this.clampToGround();

      const onGround = (this.player.y >= GROUND_Y - 64 - 1);
      if (onGround && this.player.anims.currentAnim?.key === 'jump') {
        this.player.play('ride');
      }
      // reset counter lompat saat menyentuh tanah
      if (onGround) this.jumpCount = 0;
    }

    if (this.cursors.space?.isDown || this.cursors.up?.isDown) this.tryJump();
    this.obstacles.children.iterate(o=>{ if (o && o.x < -120) o.destroy(); });
  }
}

/* =========================================================
   Config
   ========================================================= */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b9bdc',
  parent: 'game-root',
  physics: { default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

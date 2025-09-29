/* ===========================================
   RIALO SKATER — Splash -> Preview -> Game
   Fix: no double-layer, solid ground line,
   obstacles & player sit on the same baseline,
   plus Rialo coin collectibles.
   =========================================== */

const GAME_W = 1280;
const GAME_H = 720;

const GROUND_Y_RATIO = 0.72;        // posisi ground (relatif tinggi layar)
const BASE_SPEED = 200;             // kecepatan scroll world (px/s)
const JUMP_VELOCITY = -520;
const GRAVITY_Y = 1500;
const MAX_LIVES = 3;

const OBST_MIN_DELAY = 1400;
const OBST_MAX_DELAY = 2200;

const COIN_MIN_DELAY = 900;
const COIN_MAX_DELAY = 1600;

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
  coin: 'assets/collectibles/rialo-coin.png',
  bgm: 'assets/audio/bgm.mp3',
};

/* ---------------- Splash ---------------- */
class SplashScene extends Phaser.Scene {
  constructor(){ super('Splash'); }
  preload(){
    this.load.image('splashBg', ASSETS.splash);
    this.load.image('mapPreview', ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create(){
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height);
    bg.setScale(s);

    const play = this.add.rectangle(GAME_W/2, GAME_H/2+120, 260, 72, 0xFFC62E)
      .setStrokeStyle(6, 0x1b1b1b).setInteractive({cursor:'pointer'});
    this.add.text(play.x, play.y, 'PLAY', {fontSize:'36px', fontFamily:'system-ui, sans-serif', color:'#0b0f14', fontStyle:'900'}).setOrigin(0.5);
    play.on('pointerup', ()=> this.scene.start('Preview'));

    this.add.text(GAME_W/2, GAME_H-26, 'Powered by Rialo', {fontSize:'18px', color:'#cfd8dc', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);
  }
}

/* ---------------- Preview ---------------- */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('Preview'); }
  create(){
    this.cameras.main.setBackgroundColor('#0f1316');
    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {fontSize:'36px', color:'#b2ebf2', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);

    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y - mapPanel.height/2 - 28, 'Map', {fontSize:'28px', color:'#80deea', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);

    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y - charPanel.height/2 - 28, 'Character', {fontSize:'28px', color:'#80deea', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W/2, GAME_H-90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'SKATE!', {fontSize:'36px', fontStyle:'900', color:'#061016', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('Game'));
    const back = this.add.text(24,24,'← Back', {fontSize:'20px', color:'#90caf9', fontFamily:'system-ui, sans-serif'}).setInteractive({cursor:'pointer'});
    back.on('pointerup', ()=> this.scene.start('Splash'));
  }
}

/* ---------------- Game ---------------- */
class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  preload(){
    // background
    ASSETS.city.forEach((p,i)=> this.load.image(`city${i+1}`, p));
    // player & items
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_barrier2', ASSETS.obstacles[1]);
    this.load.image('obs_cone', ASSETS.obstacles[2]);
    this.load.image('coin', ASSETS.coin);
    // audio (optional)
    this.load.audio('bgm', ASSETS.bgm);
    // tiny white pixel for ground physics
    const gfx = this.make.graphics({x:0,y:0,add:false});
    gfx.fillStyle(0xffffff,1).fillRect(0,0,2,2);
    gfx.generateTexture('px',2,2);
    gfx.destroy();
  }

  create(){
    /* --- baseline & bg --- */
    this.groundY = Math.round(GAME_H * GROUND_Y_RATIO);

    // langit (blok warna agar tidak terlihat area hitam)
    this.add.rectangle(GAME_W/2, GAME_H/2, GAME_W, GAME_H, 0x12a3d4).setAlpha(0.0); // transparan (warna scene dari CSS)

    // Single skyline tileSprite, dirapatkan ke ground (origin bottom)
    this.skyline = this.add.tileSprite(0, this.groundY - 2, GAME_W, this.groundY, 'city6')
      .setOrigin(0,1);      // bawahnya nempel ground
    // sedikit layering tambahan tipis untuk parallax lembut
    this.skylineFar = this.add.tileSprite(0, this.groundY - 120, GAME_W, 420, 'city3')
      .setOrigin(0,1).setAlpha(0.85);

    // “Ground” visual bar (tipis), hanya untuk garis
    this.add.rectangle(GAME_W/2, this.groundY, GAME_W, 6, 0x0d6efd).setOrigin(0.5,0.5).setAlpha(0.75);

    /* --- physics world & solid ground --- */
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H+300);

    // ground collider (tak terlihat), statik & lebar > layar agar aman
    this.ground = this.physics.add.staticImage(GAME_W/2, this.groundY+4, 'px')
      .setScale(GAME_W, 10).refreshBody().setVisible(false);

    /* --- player --- */
    this.player = this.physics.add.sprite(180, this.groundY - 64, 'skater', 1);
    this.player.setGravityY(GRAVITY_Y).setCollideWorldBounds(true);
    // hitbox kecil & offset biar fair
    this.player.body.setSize(60, 80).setOffset(34, 36);
    this.physics.add.collider(this.player, this.ground);

    // anims
    this.anims.create({ key:'ride', frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump', frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0 });
    this.anims.create({ key:'idle', frames:[{key:'skater',frame:0}], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });
    this.player.play('ride');

    /* --- UI --- */
    this.score = 0;
    this.coins = 0;
    this.lives = MAX_LIVES;

    this.scoreText = this.add.text(24, 24, 'Score: 0', {fontSize:'34px', color:'#ffffff', fontFamily:'system-ui, sans-serif'});
    this.coinText  = this.add.text(24, 68, 'Coins: 0', {fontSize:'26px', color:'#c6f6d5', fontFamily:'system-ui, sans-serif'});
    this.hearts = [];
    for(let i=0;i<MAX_LIVES;i++){
      const h = this.add.text(GAME_W-26 - i*28, 24, '❤',{fontSize:'28px'}).setTint(0xff6688).setOrigin(1,0);
      this.hearts.push(h);
    }

    // musik (aman kalau file tidak ada)
    try { if (this.cache.audio.exists('bgm')) { this.bgm = this.sound.add('bgm',{loop:true,volume:0.35}); this.bgm.play(); } } catch(_){}

    /* --- groups --- */
    this.obstacles = this.physics.add.group();
    this.coinsGroup = this.physics.add.group();
    this.pipes = this.add.group(); // dekorasi (tanpa physics)

    // overlap
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
    this.physics.add.overlap(this.player, this.coinsGroup, this.onCoin, null, this);

    // timers
    this.time.addEvent({ delay: 150, loop:true, callback:()=>{ this.score++; this.scoreText.setText(`Score: ${this.score}`); } });
    this.scheduleNextObstacle();
    this.scheduleNextCoin();
    this.scheduleNextPipe();

    // controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', ()=> this.tryJump());

    // states
    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  /* ---------- Spawners ---------- */
  scheduleNextObstacle(){
    const d = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(d, ()=> this.spawnObstacle());
  }
  spawnObstacle(){
    if (this.isGameOver) return;
    const k = Phaser.Utils.Array.GetRandom(['obs_barrier','obs_barrier2','obs_cone']);
    const o = this.obstacles.create(GAME_W+60, this.groundY, k);
    o.setOrigin(0.5,1).setImmovable(true);
    o.body.allowGravity = false;
    // skala & hitbox
    o.setScale(0.85);
    const bw = o.width * 0.7, bh = o.height * 0.6;
    o.body.setSize(bw, bh).setOffset((o.width-bw)/2, (o.height-bh));
    o.setVelocityX(-BASE_SPEED);
    o.setDepth(5);
    this.scheduleNextObstacle();
  }

  scheduleNextCoin(){
    const d = Phaser.Math.Between(COIN_MIN_DELAY, COIN_MAX_DELAY);
    this.time.delayedCall(d, ()=> this.spawnCoin());
  }
  spawnCoin(){
    if (this.isGameOver) return;
    const hover = Phaser.Math.Between(90, 160);
    const c = this.coinsGroup.create(GAME_W+50, this.groundY - hover, 'coin');
    c.setScale(0.9).setDepth(6);
    c.body.allowGravity = false;
    c.setVelocityX(-BASE_SPEED);
    this.scheduleNextCoin();
  }

  scheduleNextPipe(){
    const d = Phaser.Math.Between(1600, 2400);
    this.time.delayedCall(d, ()=> {
      if (this.isGameOver) return;
      // pipa dekoratif (sprite dari px yang di-stretch)
      const y = Phaser.Math.Between(this.groundY-200, this.groundY-60);
      const len = Phaser.Math.Between(180, 360);
      const bar = this.add.image(GAME_W+len/2, y, 'px').setOrigin(0.5,0.5).setScale(len, 6).setTint(0x9aa4b2).setAlpha(0.9);
      this.pipes.add(bar);
      this.tweens.add({ targets: bar, x: -400, duration: (GAME_W+600)/BASE_SPEED*1000, ease:'Linear',
        onComplete:()=> bar.destroy()
      });
      this.scheduleNextPipe();
    });
  }

  /* ---------- Interactions ---------- */
  tryJump(){
    if (this.isGameOver) return;
    // boleh lompat kalau sedang nempel ground
    if (this.player.body.blocked.down){
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
    }
  }

  onHit(player, obst){
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;
    this.lives--; this.updateHearts();

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 900;
    this.time.delayedCall(180, ()=> player.clearTint());
    this.time.delayedCall(220, ()=> player.play('ride'));

    if (this.lives<=0) this.gameOver();
  }

  onCoin(player, coin){
    coin.destroy();
    this.coins++;
    this.coinText.setText(`Coins: ${this.coins}`);
  }

  updateHearts(){
    this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver(){
    this.isGameOver = true;
    // stop world
    this.obstacles.setVelocityX(0);
    this.coinsGroup.setVelocityX(0);
    this.player.setVelocity(0,0).play('crash');

    if (this.bgm) this.bgm.stop();

    const dim = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.6).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 620, 320, 0x0f172a, 0.95).setStrokeStyle(6, 0x22e3a3);
    this.add.text(GAME_W/2, panel.y-96, 'Game Over', {fontSize:'54px', color:'#e3f2fd', fontFamily:'system-ui, sans-serif', fontStyle:'900'}).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y-28, `Score: ${this.score}   •   Coins: ${this.coins}`, {fontSize:'28px', color:'#b2ebf2', fontFamily:'system-ui, sans-serif'}).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2-120, panel.y+70, 200, 60, 0x22e3a3).setStrokeStyle(4, 0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnR.x, btnR.y, 'Restart', {fontSize:'26px', color:'#061016', fontFamily:'system-ui, sans-serif', fontStyle:'800'}).setOrigin(0.5);
    btnR.on('pointerup', ()=> this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2+120, panel.y+70, 200, 60, 0x1DA1F2).setStrokeStyle(4, 0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnS.x, btnS.y, 'Share', {fontSize:'26px', color:'#ffffff', fontFamily:'system-ui, sans-serif', fontStyle:'800'}).setOrigin(0.5);
    btnS.on('pointerup', ()=>{
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score} • Coins: ${this.coins} 🛹`);
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(time, delta){
    // parallax aman (tidak double layer)
    const dt = delta/1000;
    this.skyline.tilePositionX += BASE_SPEED * 0.12 * dt;
    this.skylineFar.tilePositionX += BASE_SPEED * 0.05 * dt;

    // anim balik ke ride ketika mendarat
    if (!this.isGameOver && this.player.body.blocked.down){
      const a = this.player.anims.currentAnim?.key;
      if (a === 'jump') this.player.play('ride');
    }

    // keyboard jump
    if (this.space.isDown || this.cursors.up.isDown) this.tryJump();

    // bersihkan yang offscreen
    this.obstacles.children.iterate(o=>{ if (o && o.x < -120) o.destroy(); });
    this.coinsGroup.children.iterate(c=>{ if (c && c.x < -120) c.destroy(); });
  }
}

/* -------------- Game Config -------------- */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0f14',
  parent: 'game-root',
  physics: { default: 'arcade', arcade: { gravity:{y:0}, debug:false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

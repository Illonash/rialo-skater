/* =========================================================
   RIALO SKATER — Splash -> Preview -> Game
   + Rialo Coin (collectible) & Pipe Decor
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

// Kecepatan & fisika
const BASE_SPEED      = 180;
const JUMP_VELOCITY   = -470;
const GRAVITY_Y       = 1400;
const MAX_LIVES       = 3;

// Spawn obstacle
const OBST_MIN_DELAY  = 1600;
const OBST_MAX_DELAY  = 2400;

// Coin (collectible)
const COIN_VALUE      = 5;
const COIN_SIZE       = 32;
const COIN_MIN_DELAY  = 1200;
const COIN_MAX_DELAY  = 2200;

// Pipe (dekoratif)
const PIPE_MIN_DELAY  = 1400;
const PIPE_MAX_DELAY  = 2600;

const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',

  // spritesheet 9 frame @ 128x128 (0..8)
  skater:      'assets/skater_girl.png',

  // city layers (kita pakai 1 layer saja supaya tidak “double”)
  city:        'assets/maps/city/city6.png',

  obstacles: {
    cone:      'assets/obstacles/cone.png',
    barrier:   'assets/obstacles/barrier.png',
    barrier2:  'assets/obstacles/barrier2.png',
  },

  coin:        'assets/collectibles/rialo_coin.png', // <— logo coin kamu
  bgm:         'assets/audio/bgm.mp3',               // opsional
};

/* ---------------- Splash ---------------- */
class SplashScene extends Phaser.Scene {
  constructor(){ super('SplashScene'); }
  preload(){
    this.load.image('splashBg', ASSETS.splash);
  }
  create(){
    const bg = this.add.image(GAME_W/2, GAME_H/2, 'splashBg');
    const s = Math.max(GAME_W/bg.width, GAME_H/bg.height); bg.setScale(s);

    const btn = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 260, 70, 0xF9C315)
      .setStrokeStyle(6, 0x1f1f1f).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'PLAY', {fontFamily:'system-ui',fontSize:'36px',color:'#111',fontStyle:'900'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('PreviewScene'));

    this.add.text(GAME_W/2, GAME_H-28, 'Powered by Rialo',
      {fontFamily:'system-ui',fontSize:'18px',color:'#cfd8dc'}).setOrigin(0.5);
  }
}

/* ---------------- Preview ---------------- */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }
  preload(){
    this.load.image('mapPreview',  ASSETS.mapPreview);
    this.load.image('charPreview', ASSETS.charPreview);
  }
  create(){
    this.cameras.main.setBackgroundColor('#0f1316');

    this.add.text(GAME_W/2, 70, 'Choose Map & Character', {
      fontFamily:'system-ui', fontSize:'36px', color:'#b2ebf2'
    }).setOrigin(0.5);

    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y-mapPanel.height/2-28, 'Map', {fontFamily:'system-ui',fontSize:'28px',color:'#80deea'}).setOrigin(0.5);

    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y-charPanel.height/2-28, 'Character', {fontFamily:'system-ui',fontSize:'28px',color:'#80deea'}).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W/2, GAME_H-90, 260, 70, 0x22e3a3).setStrokeStyle(6, 0x0a0f12).setInteractive({cursor:'pointer'});
    this.add.text(btn.x, btn.y, 'SKATE!', {fontFamily:'system-ui',fontSize:'36px',fontStyle:'900',color:'#0a0f12'}).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('GameScene'));

    const back = this.add.text(24,24,'← Back',{fontFamily:'system-ui',fontSize:'20px',color:'#90caf9'}).setInteractive({cursor:'pointer'});
    back.on('pointerup', ()=> this.scene.start('SplashScene'));
  }
}

/* ---------------- Game ---------------- */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload(){
    // 1 layer city supaya tidak double
    this.load.image('city', ASSETS.city);

    // obstacles
    this.load.image('obs_cone',     ASSETS.obstacles.cone);
    this.load.image('obs_barrier',  ASSETS.obstacles.barrier);
    this.load.image('obs_barrier2', ASSETS.obstacles.barrier2);

    // player
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });

    // coin
    this.load.image('coin', ASSETS.coin);

    // music (optional)
    this.load.audio('bgm', ASSETS.bgm);
  }

  create(){
    /* ---- Musik aman (optional) ---- */
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 }); this.bgm.play();
      }
    } catch(_) {}

    /* ---- Background utama (1 layer, tidak double) ---- */
    this.bg = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city').setOrigin(0,0);
    // Kecepatan parallax lembut
    this.parallaxSpeed = 24;

    /* ---- Ground: ambil garis “horizon” yang kamu mau ----
       Angka ini dipilih agar karakter & obstacle tepat di garis kota bawah
       Silakan tweak +/− 6 px kalau perlu */
    this.groundY = Math.round(GAME_H * 0.79);

    // garis tipis ground (estetika)
    this.add.rectangle(0, this.groundY, GAME_W, 2, 0x0ea5e9, 0.25).setOrigin(0,1).setDepth(5);

    /* ---- Physics ---- */
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);

    /* ---- Player ---- */
    this.player = this.physics.add.sprite(160, this.groundY - 64, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    this.player.body.setSize(60, 80).setOffset(34, 36);
    // Anim
    this.anims.create({ key:'ride',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0 });
    this.anims.create({ key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });
    this.player.play('ride');

    // Kontrol (double jump)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.jumpsLeft = 2;
    this.input.on('pointerdown', () => this.tryJump());

    /* ---- UI ---- */
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16, 18, 'Score: 0', {fontFamily:'system-ui', fontSize:'28px', color:'#ffffff'}).setDepth(50);
    this.hearts = [];
    for (let i=0;i<MAX_LIVES;i++){
      const h = this.add.text(GAME_W-28-i*28, 18, '❤', {fontSize:'28px'}).setTint(0xff6b81).setOrigin(1,0).setDepth(50);
      this.hearts.push(h);
    }

    /* ---- Groups ---- */
    this.obstacles = this.physics.add.group();
    this.coins     = this.physics.add.group();
    this.pipes     = this.physics.add.group();

    // Collision/overlap
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);
    this.physics.add.overlap(this.player, this.coins, (player, coin)=>{
      coin.disableBody(true,true);
      this.coinsCollected += 1;
      this.score += COIN_VALUE;
      this.refreshHUD();
    }, null, this);

    /* ---- Coin counter ---- */
    this.coinsCollected = 0;
    this.coinText = this.add.text(16, 54, 'Coins: 0', {fontFamily:'system-ui', fontSize:'24px', color:'#ffffff'}).setDepth(50);

    /* ---- Jadwal spawn ---- */
    this.time.addEvent({ delay:150, loop:true, callback:()=>{ this.score += 1; this.refreshHUD(); }});
    this.scheduleObstacle();
    this.scheduleCoin();
    this.schedulePipe();

    /* ---- Pipe texture runtime (1x buat) ---- */
    this.makePipeTexture();

    /* ---- Flags ---- */
    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  /* --------- Helpers --------- */
  refreshHUD(){
    this.scoreText.setText(`Score: ${this.score}`);
    this.coinText.setText(`Coins: ${this.coinsCollected}`);
  }

  tryJump(){
    if (this.isGameOver) return;
    const onGround = (this.player.y >= this.groundY - 64 - 1) && this.player.body.velocity.y >= 0;
    if (onGround) this.jumpsLeft = 2; // reset
    if (this.jumpsLeft > 0){
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
      this.jumpsLeft -= 1;
    }
  }

  updateHearts(){
    this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  /* --------- Spawners --------- */
  scheduleObstacle(){
    const d = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(d, ()=>{ if(!this.isGameOver) this.spawnObstacle(); this.scheduleObstacle(); });
  }
  spawnObstacle(){
    const keys = ['obs_cone','obs_barrier','obs_barrier2'];
    const key  = Phaser.Utils.Array.GetRandom(keys);
    const y    = this.groundY;                         // nempel ground
    const obj  = this.obstacles.create(GAME_W+40, y, key);
    obj.setOrigin(0.5,1);
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setScale(0.9);
    // hitbox fair
    obj.body.setSize(obj.width*0.7, obj.height*0.6).setOffset(obj.width*0.15, obj.height*0.0);
    obj.setVelocityX(-BASE_SPEED);
    obj.checkWorldBounds = true; obj.outOfBoundsKill = true;
  }

  scheduleCoin(){
    const d = Phaser.Math.Between(COIN_MIN_DELAY, COIN_MAX_DELAY);
    this.time.delayedCall(d, ()=>{ if(!this.isGameOver) this.spawnCoin(); this.scheduleCoin(); });
  }
  spawnCoin(){
    const minY = this.groundY - 180;
    const maxY = this.groundY -  90;
    const y = Phaser.Math.Between(minY, maxY);
    const coin = this.coins.create(GAME_W+40, y, 'coin');
    coin.setScale(COIN_SIZE/coin.width);
    coin.setDepth(20);
    coin.body.allowGravity = false;
    coin.setVelocityX(-BASE_SPEED);
    coin.setCircle((COIN_SIZE*0.45)/2);
    coin.checkWorldBounds = true; coin.outOfBoundsKill = true;
  }

  schedulePipe(){
    const d = Phaser.Math.Between(PIPE_MIN_DELAY, PIPE_MAX_DELAY);
    this.time.delayedCall(d, ()=>{ if(!this.isGameOver) this.spawnPipe(); this.schedulePipe(); });
  }
  makePipeTexture(){
    // generate texture sekali
    if (this.textures.exists('pipeTex')) return;
    const g = this.make.graphics({x:0,y:0,add:false});
    const W=320,H=16, rail=4;
    g.fillStyle(0x6c757d,1); g.fillRoundedRect(0,(H-rail)/2,W,rail,2);
    g.fillStyle(0xadb5bd,1); g.fillRect(0,(H-rail)/2,W,1);
    g.fillStyle(0x6c757d,1); g.fillRect(18,H-6,6,6); g.fillRect(W-24,H-6,6,6);
    g.generateTexture('pipeTex', W, H); g.destroy();
  }
  spawnPipe(){
    const y = this.groundY - Phaser.Math.Between(26,48);
    const pipe = this.pipes.create(GAME_W+60, y, 'pipeTex');
    pipe.setOrigin(0,1);
    pipe.body.allowGravity = false; pipe.setImmovable(true);
    pipe.setVelocityX(-BASE_SPEED);
    this.tweens.add({ targets:pipe, y:y+Phaser.Math.Between(-3,3), duration:900, yoyo:true, repeat:2, ease:'Sine.inOut' });
    pipe.checkWorldBounds = true; pipe.outOfBoundsKill = true;
  }

  /* --------- Hit & Game Over --------- */
  handleHit(player, obstacle){
    const now = this.time.now; if (now < this.invulnUntil || this.isGameOver) return;
    this.lives -= 1; this.updateHearts();
    player.play('crash', true); player.setTint(0xff8080);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(220, ()=> player.clearTint());
    this.time.delayedCall(240, ()=> player.play('ride'));

    if (this.lives <= 0) this.gameOver();
  }

  gameOver(){
    this.isGameOver = true;
    this.player.play('crash'); this.player.setVelocity(0,0);
    this.obstacles.setVelocityX(0); this.coins.setVelocityX(0); this.pipes.setVelocityX(0);
    if (this.bgm) this.bgm.stop();

    const dim   = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.6).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 620, 320, 0x0f172a, 0.95).setStrokeStyle(6, 0x22e3a3);
    this.add.text(GAME_W/2, panel.y-100, 'Game Over', {fontFamily:'system-ui',fontSize:'54px',color:'#e3f2fd',fontStyle:'900'}).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y-28, `Score: ${this.score}   •   Coins: ${this.coinsCollected}`, {fontFamily:'system-ui',fontSize:'28px',color:'#b2ebf2'}).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2-120, panel.y+70, 200, 60, 0x22e3a3).setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnR.x, btnR.y, 'Restart', {fontFamily:'system-ui',fontSize:'26px',fontStyle:'800',color:'#061016'}).setOrigin(0.5);
    btnR.on('pointerup', ()=> this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2+120, panel.y+70, 200, 60, 0x1DA1F2).setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnS.x, btnS.y, 'Share', {fontFamily:'system-ui',fontSize:'26px',fontStyle:'800',color:'#ffffff'}).setOrigin(0.5);
    btnS.on('pointerup', ()=>{
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score} (Coins: ${this.coinsCollected})! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  /* --------- Update --------- */
  update(_, delta){
    // Parallax halus & aman (1 layer)
    this.bg.tilePositionX += this.parallaxSpeed * (delta/1000);

    // Reset jumps ketika mendarat
    const onGround = (this.player.y >= this.groundY - 64 - 1) && this.player.body.velocity.y >= 0;
    if (onGround && this.jumpsLeft < 2) {
      this.jumpsLeft = 2;
      if (this.player.anims.currentAnim?.key === 'jump') this.player.play('ride');
      // kunci di garis ground
      this.player.y = this.groundY - 64;
    }

    // Keyboard jump (space/up)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.tryJump();
    }

    // Cleanup ringan
    this.obstacles.children.iterate(o=>{ if(o && o.x < -100) o.destroy(); });
    this.coins.children.iterate(o=>{ if(o && o.x < -80)  o.destroy(); });
    this.pipes.children.iterate(o=>{ if(o && o.x < -220) o.destroy(); });
  }
}

/* ---------------- Boot ---------------- */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0f14',
  parent: 'game-root',
  physics: { default:'arcade', arcade:{ debug:false, gravity:{ y:0 } } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],
};
new Phaser.Game(config);

/* =========================================================
   RIALO SKATER — Clean Version (Splash -> Preview -> Game)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

const BASE_SPEED = 180;               // kecepatan obstacle
const OBST_MIN_DELAY = 1600;          // jeda minimal spawn
const OBST_MAX_DELAY = 2400;          // jeda maksimal spawn
const JUMP_VELOCITY = -470;           // kekuatan lompat
const GRAVITY_Y = 1400;               // gravitasi player
const MAX_LIVES = 3;

const ASSETS = {
  splash: 'assets/splash_16x9.png',
  mapPreview: 'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater: 'assets/skater_girl.png', // spritesheet 1152x128 (9x 128px)
  city_sky:  'assets/maps/city/city2.png',
  city_mid:  'assets/maps/city/city4.png',
  city_near: 'assets/maps/city/city6.png',
  obstacles: [
    'assets/obstacles/barrier.png',
    'assets/obstacles/barrier2.png',
    'assets/obstacles/cone.png',
  ],
  bgm: 'assets/audio/bgm.mp3'
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

    const mapPanel = this.add.rectangle(380, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapPanel.x, mapPanel.y, 'mapPreview').setScale(0.65);
    this.add.text(mapPanel.x, mapPanel.y - mapPanel.height/2 - 28, 'Map', {
      fontFamily: 'system-ui', fontSize: '28px', color: '#80deea'
    }).setOrigin(0.5);

    const charPanel = this.add.rectangle(900, 340, 520, 320, 0x121820, 0.96)
      .setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charPanel.x, charPanel.y, 'charPreview').setScale(0.9);
    this.add.text(charPanel.x, charPanel.y - charPanel.height/2 - 28, 'Character', {
      fontFamily: 'system-ui', fontSize: '28px', color: '#80deea'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x22e3a3)
      .setStrokeStyle(6, 0x0a0f12).setInteractive({ cursor: 'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily: 'system-ui', fontSize: '36px', fontStyle: '900', color: '#0a0f12'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('GameScene'));
  }
}

// ---------- Game Scene ----------
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  preload() {
    this.load.image('city_sky',  ASSETS.city_sky);
    this.load.image('city_mid',  ASSETS.city_mid);
    this.load.image('city_near', ASSETS.city_near);

    this.load.image('obs_barrier',  ASSETS.obstacles[0]);
    this.load.image('obs_barrier2', ASSETS.obstacles[1]);
    this.load.image('obs_cone',     ASSETS.obstacles[2]);

    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });
    this.load.audio('bgm', ASSETS.bgm);
  }

  create() {
    // Musik
    try {
      if (this.cache.audio.exists('bgm')) {
        this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 });
        this.bgm.play();
      }
    } catch(_) {}

    // Background parallax
    this.layers = [
      this.add.tileSprite(0,0,GAME_W,GAME_H,'city_sky').setOrigin(0,0),
      this.add.tileSprite(0,0,GAME_W,GAME_H,'city_mid').setOrigin(0,0),
      this.add.tileSprite(0,0,GAME_W,GAME_H,'city_near').setOrigin(0,0),
    ];
    this.parallaxSpeed = [6, 12, 20];

    // World & ground
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
    this.groundY = GAME_H - 110;

    // Player
    this.player = this.physics.add.sprite(160, this.groundY - 64, 'skater', 1);
    this.player.setCollideWorldBounds(true).setGravityY(GRAVITY_Y);
    this.player.body.setSize(60,80).setOffset(34,36);

    this.anims.create({ key:'ride', frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump', frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12 });
    this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1 });
    this.player.play('ride');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump());

    // Score + Lives
    this.score = 0; this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16,18,'Score: 0',{ fontFamily:'system-ui', fontSize:'28px', color:'#fff' });
    this.hearts = [];
    for(let i=0;i<MAX_LIVES;i++){
      const h = this.add.text(GAME_W - 28 - i*28, 18, '❤',{fontSize:'28px'}).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    // Obstacles
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player,this.obstacles,this.handleHit,null,this);

    this.time.addEvent({ delay:150, loop:true, callback:()=>{ this.score++; this.scoreText.setText(`Score: ${this.score}`); }});
    this.scheduleNextObstacle();

    this.isGameOver = false;
    this.invulnUntil = 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, ()=>this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const keys = ['obs_barrier','obs_barrier2','obs_cone'];
    const key = Phaser.Utils.Array.GetRandom(keys);
    const o = this.obstacles.create(GAME_W+60,this.groundY,key);
    o.setOrigin(0.5,1).setImmovable(true);
    o.body.allowGravity = false;
    o.setVelocityX(-BASE_SPEED);
    o.setScale(0.95);
    o.body.setSize(o.width*0.7,o.height*0.6).setOffset(o.width*0.15,o.height*0.4);
    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;
    const onGround = this.player.body.blocked.down || this.player.y >= this.groundY-64;
    if (onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump',true);
    }
  }

  handleHit(player, obstacle) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;
    this.lives--; this.updateHearts();
    player.play('crash',true).setTint(0xff8080);
    this.invulnUntil = now+1000;
    this.time.delayedCall(200,()=>player.clearTint());
    this.time.delayedCall(220,()=>player.play('ride'));
    if (this.lives <= 0) this.gameOver();
  }

  updateHearts() {
    this.hearts.forEach((h,i)=>h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver() {
    this.isGameOver = true;
    this.player.play('crash');
    this.obstacles.children.iterate(o=>o && o.setVelocityX(0));
    if (this.bgm) this.bgm.stop();

    const dim = this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.6).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2,GAME_H/2,620,320,0x0f172a,0.95).setStrokeStyle(6,0x22e3a3);

    this.add.text(GAME_W/2,panel.y-100,'Game Over',{fontFamily:'system-ui',fontSize:'54px',color:'#e3f2fd',fontStyle:'900'}).setOrigin(0.5);
    this.add.text(GAME_W/2,panel.y-28,`Score: ${this.score}`,{fontFamily:'system-ui',fontSize:'32px',color:'#b2ebf2'}).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2-120,panel.y+70,200,60,0x22e3a3)
      .setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnR.x,btnR.y,'Restart',{fontFamily:'system-ui',fontSize:'26px',fontStyle:'800',color:'#061016'}).setOrigin(0.5);
    btnR.on('pointerup',()=>this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2+120,panel.y+70,200,60,0x1DA1F2)
      .setStrokeStyle(4,0x061016).setInteractive({cursor:'pointer'});
    this.add.text(btnS.x,btnS.y,'Share',{fontFamily:'system-ui',fontSize:'26px',fontStyle:'800',color:'#fff'}).setOrigin(0.5);
    btnS.on('pointerup',()=>{
      const text=encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url=encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`,'_blank');
    });
  }

  update(_,delta) {
    const dt=delta/1000;
    this.layers.forEach((layer,i)=>layer.tilePositionX += this.parallaxSpeed[i]*dt);
    const onGround=this.player.body.blocked.down||this.player.y>=this.groundY-64;
    if(onGround && this.player.anims.currentAnim?.key==='jump') this.player.play('ride');
    if(this.cursors.space?.isDown||this.cursors.up?.isDown) this.tryJump();
    this.obstacles.children.iterate(o=>{ if(o && o.x<-100) o.destroy(); });
  }
}

const config={
  type:Phaser.AUTO,
  width:GAME_W,
  height:GAME_H,
  backgroundColor:'#0b0f14',
  parent:'game-root',
  physics:{ default:'arcade', arcade:{debug:false,gravity:{y:0}}},
  scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH },
  scene:[SplashScene,PreviewScene,GameScene],
};

new Phaser.Game(config);

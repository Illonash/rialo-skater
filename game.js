/* =========================================================
   RIALO SKATER — Fix Background & Ground
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

const BASE_SPEED = 180;
const OBST_MIN_DELAY = 1600;
const OBST_MAX_DELAY = 2400;
const JUMP_VELOCITY = -470;
const GRAVITY_Y = 1400;
const MAX_LIVES = 3;

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
  bgm: 'assets/audio/bgm.mp3',
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

    this.add.image(380, 340, 'mapPreview').setScale(0.65);
    this.add.text(380, 180, 'Map', { fontSize: '28px', color: '#80deea' }).setOrigin(0.5);

    this.add.image(900, 340, 'charPreview').setScale(0.9);
    this.add.text(900, 180, 'Character', { fontSize: '28px', color: '#80deea' }).setOrigin(0.5);

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
    ASSETS.city.forEach((p,i)=>this.load.image(`city${i+1}`, p));
    this.load.image('obs_barrier', ASSETS.obstacles[0]);
    this.load.image('obs_barrier2', ASSETS.obstacles[1]);
    this.load.image('obs_cone', ASSETS.obstacles[2]);
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth: 128, frameHeight: 128, endFrame: 8 });
    this.load.audio('bgm', ASSETS.bgm);
  }
  create() {
    if (this.cache.audio.exists('bgm')) {
      this.bgm = this.sound.add('bgm', { loop: true, volume: 0.35 });
      this.bgm.play();
    }

    // hanya 1 layer background full screen
    this.bg = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'city3').setOrigin(0,0);

    this.groundY = GAME_H - 120; // pos lantai dasar

    // Player
    this.player = this.physics.add.sprite(160, this.groundY, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    this.player.body.setSize(60,80).setOffset(34,36);

    this.anims.create({ key: 'ride', frames: this.anims.generateFrameNumbers('skater', { start:1,end:4 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('skater', { start:5,end:7 }), frameRate: 12 });
    this.anims.create({ key: 'crash', frames: [{ key:'skater',frame:8 }], frameRate:1 });
    this.player.play('ride');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', ()=>this.tryJump());

    this.score = 0; this.lives = MAX_LIVES;
    this.scoreText = this.add.text(16,18,'Score: 0',{ fontSize:'28px', color:'#fff' });
    this.hearts=[]; for(let i=0;i<MAX_LIVES;i++){
      const h=this.add.text(GAME_W-28-i*28,18,'❤',{fontSize:'28px'}).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    this.obstacles=this.physics.add.group();
    this.physics.add.overlap(this.player,this.obstacles,this.handleHit,null,this);

    this.time.addEvent({delay:150,loop:true,callback:()=>{this.score+=1;this.scoreText.setText(`Score: ${this.score}`);} });
    this.scheduleNextObstacle();

    this.isGameOver=false; this.invulnUntil=0;
  }

  scheduleNextObstacle(){
    const d=Phaser.Math.Between(OBST_MIN_DELAY,OBST_MAX_DELAY);
    this.time.delayedCall(d,()=>this.spawnObstacle());
  }

  spawnObstacle(){
    if(this.isGameOver)return;
    const keys=['obs_barrier','obs_barrier2','obs_cone'];
    const key=Phaser.Utils.Array.GetRandom(keys);
    const obj=this.obstacles.create(GAME_W+40,this.groundY,key);
    obj.setOrigin(0.5,1).setImmovable(true);
    obj.body.allowGravity=false;
    obj.setVelocityX(-BASE_SPEED);
    this.scheduleNextObstacle();
  }

  tryJump(){
    if(this.isGameOver)return;
    const onGround=this.player.body.blocked.down||this.player.y>=this.groundY-64;
    if(onGround){
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump',true);
    }
  }

  handleHit(player,obstacle){
    const now=this.time.now;
    if(now<this.invulnUntil||this.isGameOver)return;
    this.lives--; this.updateHearts();
    player.play('crash'); player.setTint(0xff8080);
    this.invulnUntil=now+1000;
    this.time.delayedCall(200,()=>player.clearTint());
    this.time.delayedCall(220,()=>player.play('ride'));
    if(this.lives<=0)this.gameOver();
  }

  updateHearts(){ this.hearts.forEach((h,i)=>h.setAlpha(i<this.lives?1:0.25)); }

  gameOver(){
    this.isGameOver=true; this.player.play('crash'); if(this.bgm)this.bgm.stop();
    this.obstacles.setVelocityX(0);
    this.add.text(GAME_W/2,GAME_H/2,`Game Over\nScore: ${this.score}`,{fontSize:'42px',color:'#fff'}).setOrigin(0.5);
  }

  update(time,delta){
    this.bg.tilePositionX += BASE_SPEED * delta/1000;
    if(this.cursors.space.isDown||this.cursors.up.isDown)this.tryJump();
  }
}

// ---------- Config ----------
const config = {
  type: Phaser.AUTO, width: GAME_W, height: GAME_H, parent:'game-root',
  physics:{ default:'arcade', arcade:{gravity:{y:0}, debug:false} },
  scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene:[SplashScene,PreviewScene,GameScene]
};
new Phaser.Game(config);

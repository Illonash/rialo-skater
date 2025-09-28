/* =============================
   Rialo Skater — game.js (FULL)
   ============================= */

const WIDTH  = 1280;
const HEIGHT = 720;

const ASSET = {
  splash: 'assets/splash_16x9.png',                                // opsional
  skaterSheet: 'assets/skater_girl.png',                            // 1152x128, 9 frame @128
  charPreview: 'assets/char_skater_preview.png',
  mapPreview: 'assets/maps/city/map_city_preview.png',
  // map layers (parallax)
  city1: 'assets/maps/city/city1.png',
  city2: 'assets/maps/city/city2.png',
  city3: 'assets/maps/city/city3.png',
  city4: 'assets/maps/city/city4.png',
  city5: 'assets/maps/city/city5.png',
  city6: 'assets/maps/city/city6.png',
  // obstacles (SUDAH di-rename -> barrier / barrier2)
  ob1: 'assets/obstacles/barrier.png',
  ob2: 'assets/obstacles/barrier2.png',
  ob3: 'assets/obstacles/cone.png'
};

class BootScene extends Phaser.Scene {
  constructor(){ super('boot'); }
  preload(){
    // minimal assets agar menu muncul cepat
    this.load.image('splash', ASSET.splash);
    this.load.image('char_preview', ASSET.charPreview);
    this.load.image('map_preview', ASSET.mapPreview);
  }
  create(){
    this.scene.start('menu');
  }
}

class MenuScene extends Phaser.Scene {
  constructor(){ super('menu'); }
  create(){
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // background sederhana
    this.cameras.main.setBackgroundColor('#0f1418');

    // judul
    this.add.text(cx, cy - 120, 'Rialo Skater', {
      fontFamily: 'system-ui, -apple-system, Segoe UI',
      fontSize: 64, color:'#fff', fontStyle:'bold'
    }).setOrigin(0.5);

    // tombol
    const btn = this.add.rectangle(cx, cy + 40, 280, 72, 0xF9C513).setStrokeStyle(4, 0x262626).setInteractive({ useHandCursor:true });
    this.add.text(btn.x, btn.y, 'PLAY', { fontFamily:'system-ui', fontSize:32, color:'#000', fontStyle:'bold' }).setOrigin(0.5);

    btn.on('pointerup', ()=> this.scene.start('select'));
  }
}

class SelectScene extends Phaser.Scene {
  constructor(){ super('select'); }
  preload(){
    // load preview + sprite utama + map untuk game
    this.load.spritesheet('skater_sheet', ASSET.skaterSheet, { frameWidth:128, frameHeight:128 });
    this.load.image('map_prev', ASSET.mapPreview);
    this.load.image('char_prev', ASSET.charPreview);

    // city layers
    this.load.image('city1', ASSET.city1);
    this.load.image('city2', ASSET.city2);
    this.load.image('city3', ASSET.city3);
    this.load.image('city4', ASSET.city4);
    this.load.image('city5', ASSET.city5);
    this.load.image('city6', ASSET.city6);

    // obstacles
    this.load.image('ob_barrier1', ASSET.ob1);
    this.load.image('ob_barrier2', ASSET.ob2);
    this.load.image('ob_cone',     ASSET.ob3);
  }
  create(){
    const cam = this.cameras.main;
    cam.setBackgroundColor('#0f1418');

    const pad = 48;
    const leftX  = pad + (WIDTH/2 - pad*2) * 0.5;
    const rightX = WIDTH/2 + pad + (WIDTH/2 - pad*2) * 0.5;
    const topY   = 140;

    // judul kecil
    this.add.text(WIDTH*0.25, 72, 'City', {fontFamily:'system-ui', fontSize:28, color:'#9BEAC9'}).setOrigin(0.5,0.5);
    this.add.text(WIDTH*0.75, 72, 'Skater Girl', {fontFamily:'system-ui', fontSize:28, color:'#9BEAC9'}).setOrigin(0.5,0.5);

    // map preview (kiri)
    const mapPanel = this.add.rectangle(WIDTH*0.25, topY+180, 540, 360, 0x11181F, 1).setStrokeStyle(3, 0x20E3AD);
    this.add.image(mapPanel.x, mapPanel.y, 'map_prev').setDisplaySize(520, 320);

    // character preview (kanan)
    const charPanel = this.add.rectangle(WIDTH*0.75, topY+180, 540, 360, 0x11181F, 1).setStrokeStyle(3, 0x20E3AD);
    this.add.image(charPanel.x, charPanel.y, 'char_prev').setDisplaySize(320, 320);

    // tombol SKATE
    const skateBtn = this.add.rectangle(WIDTH/2, HEIGHT - 100, 300, 70, 0x20E3AD).setInteractive({useHandCursor:true});
    this.add.text(skateBtn.x, skateBtn.y, 'SKATE!', {fontFamily:'system-ui', fontSize:34, color:'#07251D', fontStyle:'bold'}).setOrigin(0.5);
    skateBtn.on('pointerup', ()=> this.scene.start('game', { map: 'city' }));
  }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('game'); }

  init(data){
    this.mapKey = data?.map || 'city';
  }

  create(){
    const cam = this.cameras.main;
    cam.setBackgroundColor('#0a9ed6');

    // ====== Parallax background (6 layer) ======
    const s = this.scale.gameSize;
    const W = s.width, H = s.height;

    // dasar “tanah” untuk referensi
    this.groundY = H - 64;

    // layer urutan dari belakang ke depan
    this.bg = [
      this.add.tileSprite(0, 0, W, H, 'city1').setOrigin(0,0).setDepth(0),
      this.add.tileSprite(0, 0, W, H, 'city2').setOrigin(0,0).setDepth(10),
      this.add.tileSprite(0, 0, W, H, 'city3').setOrigin(0,0).setDepth(20),
      this.add.tileSprite(0, 0, W, H, 'city4').setOrigin(0,0).setDepth(30),
      this.add.tileSprite(0, 0, W, H, 'city5').setOrigin(0,0).setDepth(40),
      this.add.tileSprite(0, 0, W, H, 'city6').setOrigin(0,0).setDepth(50)
    ];

    // garis tanah (debug & gaya)
    this.add.line(0,0, 0,this.groundY, W,this.groundY, 0x20E3AD, 80)
      .setOrigin(0,0).setDepth(5).setBlendMode('ADD');

    // ====== Player ======
    this.player = this.physics.add.sprite(220, this.groundY, 'skater_sheet', 0)
      .setOrigin(0.5,1)
      .setDepth(90);

    this.player.body.setCollideWorldBounds(true);
    this.player.body.setAllowGravity(true);
    this.player.body.setGravityY(1400);
    this.player.setBounce(0);

    // animasi dasar dari 9 frame
    this.anims.create({
      key: 'skate',
      frames: this.anims.generateFrameNumbers('skater_sheet', { start:0, end:7 }),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'crash',
      frames: this.anims.generateFrameNumbers('skater_sheet', { start:8, end:8 }),
      frameRate: 1,
      repeat: 0
    });
    this.player.play('skate');

    // keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', ()=> this.jump());

    // HUD: score + hearts + obstacle counter (debug)
    this.score = 0;
    this.lives = 3;
    this.scoreTxt = this.add.text(20, 16, 'Score: 0', { fontFamily:'system-ui', fontSize:22, color:'#fff' })
      .setScrollFactor(0).setDepth(999);

    this.hearts = this.add.text(W - 120, 20, '♥♥♥', { fontFamily:'system-ui', fontSize:26, color:'#ff6b6b' })
      .setScrollFactor(0).setDepth(999);

    this.debugObCount = this.add.text(20, 48, 'Obs: 0', { fontFamily:'system-ui', fontSize:18, color:'#9ee' })
      .setScrollFactor(0).setDepth(999);
    this.obMakeCount = 0;

    // group obstacles
    this.obstacles = this.physics.add.group({ allowGravity:false, immovable:true });

    // collider
    this._obsCollider = this.physics.add.overlap(this.player, this.obstacles, (pl, obs)=>{
      this.hitObstacle(obs);
    });

    // kecepatan “jalan”
    this.speed = 260;

    // spawn timer (tiap 1.5s)
    this.obTimer = this.time.addEvent({ delay: 1500, loop:true, callback:()=>this.spawnObstacle() });

    // score tick
    this.time.addEvent({
      delay: 150, loop: true,
      callback: ()=> { this.score += 1; this.scoreTxt.setText(`Score: ${this.score}`); }
    });
  }

  jump(){
    // boleh lompat jika dekat tanah
    if (this.player.body.onFloor() || this.player.y >= this.groundY - 2){
      this.player.setVelocityY(-620);
    }
  }

  spawnObstacle(){
    // pilih key yang tersedia
    const keysAvail = ['ob_barrier1','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
    const useKey  = keysAvail.length ? Phaser.Utils.Array.GetRandom(keysAvail) : null;

    const W = this.scale.gameSize.width;
    const x = W + 120;
    const y = this.groundY - 4; // sedikit naik biar tidak ketutup garis

    let ob;
    if (useKey){
      ob = this.physics.add.sprite(x, y, useKey).setOrigin(0.5,1).setDepth(80)
        .setImmovable(true).setGravityY(0);
      if (useKey === 'ob_cone') ob.setScale(1.2); else ob.setScale(1.15);
    } else {
      // fallback debug (harus kelihatan)
      const w = Phaser.Math.Between(44, 72);
      const h = Phaser.Math.Between(24, 56);
      ob = this.add.rectangle(x, y, w, h, 0xff4d6d).setOrigin(0.5,1).setDepth(80);
      this.physics.add.existing(ob);
      ob.body.setAllowGravity(false).setImmovable(true);
    }

    const vX = -(this.speed + 180);
    ob.body.setVelocityX(vX);
    ob.setData('killX', -120);
    this.obstacles.add(ob);

    this.obMakeCount++;
    this.debugObCount.setText(`Obs: ${this.obMakeCount}`);
    console.log('[SPAWN]', useKey || 'rect', 'x:', x, 'y:', y, 'vX:', vX);
  }

  hitObstacle(ob){
    if (this._hitLock) return;
    this._hitLock = true;

    this.lives = Math.max(0, this.lives - 1);
    this.hearts.setText('♥'.repeat(this.lives));

    this.player.play('crash', true);
    this.player.setTint(0xff6b6b);

    this.time.delayedCall(300, ()=>{
      this.player.clearTint();
      if (this.lives > 0) this.player.play('skate', true);
      this._hitLock = false;
    });

    if (this.lives <= 0){
      this.gameOver();
    }
  }

  gameOver(){
    // matikan spawn + gerak obstacle
    this.obTimer?.remove(false);
    this.obstacles.setVelocityX(-40);
    this.player.setVelocityX(0).setVelocityY(0);
    this.player.play('crash', true);

    const W = this.scale.gameSize.width;
    const H = this.scale.gameSize.height;

    const shade = this.add.rectangle(0,0,W,H,0x000000,0.6).setOrigin(0).setDepth(999);
    this.add.text(W/2, H/2 - 20, 'Game Over', {fontFamily:'system-ui', fontSize:56, color:'#fff', fontStyle:'bold'}).setOrigin(0.5).setDepth(999);
    const btn = this.add.rectangle(W/2, H/2 + 60, 280, 66, 0x20E3AD).setDepth(999).setInteractive({useHandCursor:true});
    this.add.text(btn.x, btn.y, 'Back to Select', {fontFamily:'system-ui', fontSize:28, color:'#07251D'}).setOrigin(0.5).setDepth(999);
    btn.on('pointerup', ()=> this.scene.start('select'));
  }

  update(_, dt){
    // parallax scroll
    const v = (this.speed * (dt/1000));
    this.bg[0].tilePositionX += v * 0.10;
    this.bg[1].tilePositionX += v * 0.18;
    this.bg[2].tilePositionX += v * 0.24;
    this.bg[3].tilePositionX += v * 0.34;
    this.bg[4].tilePositionX += v * 0.52;
    this.bg[5].tilePositionX += v * 0.72;

    // bersihkan obstacle yang sudah lewat layar
    if (this.obstacles){
      this.obstacles.children.iterate(o=>{
        if (!o) return;
        const killX = o.getData('killX') ?? -120;
        if (o.x < killX) o.destroy();
      });
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0f1418',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT
  },
  scene: [BootScene, MenuScene, SelectScene, GameScene]
};

window.addEventListener('load', ()=>{
  window.game = new Phaser.Game(config);
});

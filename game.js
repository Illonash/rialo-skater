/* =========================================================
   RIALO SKATER — Splash → Preview → Game (vFinal-GroundLock)
   ========================================================= */

const GAME_W = 1280;
const GAME_H = 720;

/* ---- Gameplay tuning ---- */
const RUN_SPEED        = 220;           // kecepatan mendekatnya obstacle
const JUMP_VELOCITY    = -520;          // kekuatan lompatan
const GRAVITY_Y        = 1700;          // gravitasi pemain
const MAX_LIVES        = 3;
const OBST_MIN_DELAY   = 1400;          // spawn min (ms)
const OBST_MAX_DELAY   = 2200;          // spawn max (ms)
const OBST_SCALE       = 0.82;          // skala obstacle biar proporsional & “nempel”
const PARALLAX_SPEEDS  = [10, 16, 22, 30, 40, 52]; // px/detik, paling jauh -> paling dekat

/* ---- Assets path ---- */
const ASSETS = {
  splash:      'assets/splash_16x9.png',
  mapPreview:  'assets/maps/city/map_city_preview.png',
  charPreview: 'assets/char_skater_preview.png',
  skater:      'assets/skater_girl.png', // 9 frame @128x128
  city: [
    'assets/maps/city/city1.png',
    'assets/maps/city/city2.png',
    'assets/maps/city/city3.png',
    'assets/maps/city/city4.png',
    'assets/maps/city/city5.png',
    'assets/maps/city/city6.png',
  ],
  obstacles: {
    barrier:  'assets/obstacles/barrier.png',
    barrier2: 'assets/obstacles/barrier2.png',
    cone:     'assets/obstacles/cone.png',
  },
  bgm: 'assets/audio/bgm.mp3', // optional
};

/* =========================================================
   Splash Scene
   ========================================================= */
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

    // Tombol PLAY
    const btn = this.add.rectangle(GAME_W/2, GAME_H/2 + 120, 260, 72, 0xF9C315)
      .setStrokeStyle(6, 0x111111).setInteractive({ cursor:'pointer' });
    this.add.text(btn.x, btn.y, 'PLAY', { fontFamily:'system-ui,sans-serif', fontSize:36, color:'#101010', fontStyle:'900' }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('PreviewScene'));

    // Footer interaktif "Powered by Rialo" → Twitter @RialoHQ
    const powered = this.add.text(GAME_W/2, GAME_H - 26, 'Powered by Rialo', {
  fontFamily: '"Shadows Into Light", cursive',
  fontSize: '28px',
  color: '#00ffff',   // kamu bisa ganti warna sesuai selera
  fontStyle: 'bold'
}).setOrigin(0.5).setInteractive({ cursor:'pointer' });

powered.on('pointerup', () => {
  window.open('https://twitter.com/RialoHQ', '_blank');
});


    const goRialo = () => {
      try {
        const win = window.open('https://twitter.com/RialoHQ', '_blank', 'noopener');
        if (!win) location.href = 'https://twitter.com/RialoHQ'; // fallback jika popup diblok
      } catch {
        location.href = 'https://twitter.com/RialoHQ';
      }
    };
    powered.on('pointerup', goRialo);
    powered.on('pointerdown', goRialo); // bantu kompatibilitas mobile
  }
}

/* =========================================================
   Preview Scene (sederhana)
   ========================================================= */
class PreviewScene extends Phaser.Scene {
  constructor(){ super('PreviewScene'); }
  create(){
    this.cameras.main.setBackgroundColor('#0e1318');
    this.add.text(GAME_W/2, 80, 'Map & Character', { fontFamily:'system-ui,sans-serif', fontSize:36, color:'#9be7ff' }).setOrigin(0.5);

    const mapCard = this.add.rectangle(GAME_W/2 - 260, GAME_H/2, 520, 320, 0x101820, 0.95).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(mapCard.x, mapCard.y, 'mapPreview').setScale(0.68);
    const charCard = this.add.rectangle(GAME_W/2 + 260, GAME_H/2, 520, 320, 0x101820, 0.95).setStrokeStyle(4, 0x2dd4bf);
    this.add.image(charCard.x, charCard.y, 'charPreview').setScale(0.9);

    const btn = this.add.rectangle(GAME_W/2, GAME_H - 90, 260, 70, 0x20e3a8)
      .setStrokeStyle(6, 0x0b0f12).setInteractive({ cursor:'pointer' });
    this.add.text(btn.x, btn.y, 'SKATE!', { fontFamily:'system-ui,sans-serif', fontSize:36, color:'#0b0f12', fontStyle:'900' }).setOrigin(0.5);
    btn.on('pointerup', ()=> this.scene.start('GameScene'));

    const back = this.add.text(26, 22, '← Back', { fontFamily:'system-ui,sans-serif', fontSize:20, color:'#90caf9' }).setInteractive({ cursor:'pointer' });
    back.on('pointerup', ()=> this.scene.start('SplashScene'));
  }
}

/* =========================================================
   Game Scene
   ========================================================= */
class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  preload(){
    // City layers
    ASSETS.city.forEach((p, i)=> this.load.image(`city${i+1}`, p));
    // Obstacles
    this.load.image('ob_barrier',  ASSETS.obstacles.barrier);
    this.load.image('ob_barrier2', ASSETS.obstacles.barrier2);
    this.load.image('ob_cone',     ASSETS.obstacles.cone);
    // Skater spritesheet (9 frames)
    this.load.spritesheet('skater', ASSETS.skater, { frameWidth:128, frameHeight:128, endFrame:8 });

    // Musik optional
    this.load.audio('bgm', ASSETS.bgm);
  }

  create(){
    /* ---------- LAYOUT: Sky + Parallax Strip + Ground ---------- */

    // 1) Full sky as background (menghilangkan “kotak hitam”)
    this.add.rectangle(0,0, GAME_W, GAME_H, 0x0aa3d5).setOrigin(0); // langit dasar

    // 2) Tentukan GARIS LANTAI (ground) — ini yang kamu tandai garis hijau
    //    posisi ~ di 62.5% tinggi layar. Obstacle & player “nempel” di sini.
    this.groundY = Math.round(GAME_H * 0.625);   // <<< bisa di-tweak kecil2 bila perlu

    // 3) Parallax strip: satu baris city (Bukan dobel). Letakkan baseline tepat di groundY.
    //    Kita buat 6 tileSprite setinggi 360 px, lalu posisikan sehingga bagian dasar strip
    //    bersinggungan persis di groundY. (offsetYNegatif = stripHeight - baseMargin)
    const STRIP_H = 360;
    const baseY   = this.groundY - (STRIP_H - 18); // 18 px: kompensasi garis border asset
    this.parallax = [];
    for(let i=0;i<6;i++){
      const ts = this.add.tileSprite(0, baseY, GAME_W, STRIP_H, `city${i+1}`).setOrigin(0,0);
      this.parallax.push(ts);
    }

    // 4) Tarik rectangle “tanah” tipis (transparan) tepat di groundY sebagai acuan (invisible)
    //    plus fisik ground (static body) untuk collision.
    const groundVisual = this.add.rectangle(0, this.groundY, GAME_W, 4, 0x000000, 0).setOrigin(0,0.5);
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
    this.groundBody = this.physics.add.staticImage(GAME_W/2, this.groundY, null).setVisible(false);
    this.groundBody.displayWidth = GAME_W*2;
    this.groundBody.refreshBody();

    /* ---------- Player ---------- */
    this.player = this.physics.add.sprite(180, this.groundY - 64, 'skater', 1);
    this.player.setGravityY(GRAVITY_Y);
    this.player.setCollideWorldBounds(true);
    // hitbox yang fair
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animations
    this.anims.create({ key:'ride', frames:this.anims.generateFrameNumbers('skater', {start:1, end:4}), frameRate:10, repeat:-1 });
    this.anims.create({ key:'jump', frames:this.anims.generateFrameNumbers('skater', {start:5, end:6}), frameRate:12, repeat:0 });
    this.anims.create({ key:'idle', frames:[{ key:'skater', frame:0 }], frameRate:1 });
    this.anims.create({ key:'crash',frames:[{ key:'skater', frame:8 }], frameRate:1 });
    this.player.play('ride');

    // Colide dengan ground
    this.physics.add.collider(this.player, this.groundBody, () => {
      // Reset double jump saat nyentuh ground
      this.jumpsLeft = 2;
      if (!this.isGameOver && this.player.anims.currentAnim?.key !== 'ride') {
        this.player.play('ride');
      }
      // “snapping” kecil agar benar2 nempel di garis
      this.player.y = this.groundY - 64;
      this.player.body.velocity.y = 0;
    });

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.jumpsLeft = 2;   // double-jump
    this.input.on('pointerdown', ()=> this.tryJump());
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump());

    /* ---------- HUD ---------- */
    this.score = 0;
    this.lives = MAX_LIVES;
    this.scoreText = this.add.text(24, 22, 'Score: 0', { fontFamily:'system-ui,sans-serif', fontSize:32, color:'#ffffff' });

    this.hearts = [];
    for (let i=0;i<MAX_LIVES;i++){
      const h = this.add.text(GAME_W - 22 - i*28, 26, '❤', { fontSize:28 }).setTint(0xff6b81).setOrigin(1,0);
      this.hearts.push(h);
    }

    /* ---------- Obstacles ---------- */
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
    this.scheduleNextObstacle();

    /* ---------- BGM (optional) ---------- */
    try {
      if (this.cache.audio.exists('bgm')){
        this.bgm = this.sound.add('bgm',{ loop:true, volume:0.35 });
        this.bgm.play();
      }
    } catch(_){}

    /* ---------- State flags ---------- */
    this.isGameOver = false;
    this.invulnUntil = 0;

    // Score ticker
    this.time.addEvent({ delay:150, loop:true, callback:()=>{
      if (!this.isGameOver){
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
      }
    }});
  }

  /* ===== Helpers ===== */

  tryJump(){
    if (this.isGameOver) return;
    if (this.jumpsLeft > 0){
      this.jumpsLeft -= 1;
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
    }
  }

  scheduleNextObstacle(){
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, ()=> this.spawnObstacle());
  }

  spawnObstacle(){
    if (this.isGameOver) return;

    const keys = ['ob_barrier','ob_barrier2','ob_cone'];
    const key  = Phaser.Utils.Array.GetRandom(keys);
    const obj  = this.obstacles.create(GAME_W + 40, this.groundY, key);

    obj.setOrigin(0.5, 1);                // anchor di kaki
    obj.setImmovable(true);
    obj.body.allowGravity = false;
    obj.setScale(OBST_SCALE);

    // ukuran hitbox proporsional (biar fair & “nempel ground”)
    const bw = obj.width  * OBST_SCALE;
    const bh = obj.height * OBST_SCALE;
    obj.body.setSize(bw * 0.70, bh * 0.80).setOffset(bw * 0.15, bh * 0.20);

    obj.setVelocityX(-RUN_SPEED);

    // auto cleanup
    obj.checkWorldBounds = true;
    obj.outOfBoundsKill = true;

    this.scheduleNextObstacle();
  }

  onHit(player, obstacle){
    const now = this.time.now;
    if (this.isGameOver || now < this.invulnUntil) return;

    this.lives -= 1;
    this.updateHearts();

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 1000;
    this.time.delayedCall(200, ()=> player.clearTint());
    this.time.delayedCall(220, ()=> { if(!this.isGameOver) player.play('ride'); });

    if (this.lives <= 0){
      this.gameOver();
    }
  }

  updateHearts(){
    this.hearts.forEach((h,i)=> h.setAlpha(i < this.lives ? 1 : 0.25));
  }

  gameOver(){
    this.isGameOver = true;
    this.player.play('crash');
    this.player.setVelocity(0,0);
    this.obstacles.children.iterate(o=> o && o.setVelocityX(0));
    if (this.bgm) this.bgm.stop();

    // Overlay
    this.add.rectangle(0,0,GAME_W,GAME_H,0x000000,0.55).setOrigin(0);
    const panel = this.add.rectangle(GAME_W/2, GAME_H/2, 640, 320, 0x0f172a, 0.96).setStrokeStyle(6, 0x22e3a3);

    this.add.text(GAME_W/2, panel.y - 90, 'Game Over', { fontFamily:'system-ui,sans-serif', fontSize:56, color:'#e3f2fd', fontStyle:'900' }).setOrigin(0.5);
    this.add.text(GAME_W/2, panel.y - 24, `Score: ${this.score}`, { fontFamily:'system-ui,sans-serif', fontSize:32, color:'#b2ebf2' }).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W/2 - 130, panel.y + 70, 220, 62, 0x22e3a3)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor:'pointer' });
    this.add.text(btnR.x, btnR.y, 'Restart', { fontFamily:'system-ui,sans-serif', fontSize:26, color:'#061016', fontStyle:'800' }).setOrigin(0.5);
    btnR.on('pointerup', ()=> this.scene.restart());

    const btnS = this.add.rectangle(GAME_W/2 + 130, panel.y + 70, 220, 62, 0x1DA1F2)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor:'pointer' });
    this.add.text(btnS.x, btnS.y, 'Share', { fontFamily:'system-ui,sans-serif', fontSize:26, color:'#ffffff', fontStyle:'800' }).setOrigin(0.5);
    btnS.on('pointerup', ()=>{
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(_, delta){
    const dt = delta/1000;

    // Parallax jalan halus (tidak dobel, baseline tetap)
    this.parallax.forEach((ts, i)=> ts.tilePositionX += PARALLAX_SPEEDS[i] * dt);

    // Keyboard support untuk lompat (Space/Up)
    if (!this.isGameOver){
      if (this.cursors.space?.isDown || this.cursors.up?.isDown) {
        this.tryJump();
      }
    }

    // Bersihkan obstacle yang sudah jauh keluar layar
    this.obstacles.children.iterate(o=> { if (o && o.x < -120) o.destroy(); });
  }
}

/* =========================================================
   Game Config
   ========================================================= */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0f14',
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: { debug:false, gravity:{ y:0 } } // gravity skala di sprite player
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [SplashScene, PreviewScene, GameScene],
};

new Phaser.Game(config);

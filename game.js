// game.js — Rialo Skater (Title preview + calmer speed + wider obstacle gaps)

(() => {
  const W = 1280, H = 720;

  // ====== TUNING (lebih santai) ======
  const GRAVITY_Y = 1600;
  const JUMP_VELOCITY = -620;
  const INVINCIBLE_MS = 900;

  const SPEED_START = 180;        // dulu 260
  const SPEED_MAX   = 360;        // dulu 520
  const SPEED_UP_EVERY_MS = 8000; // dulu 5000
  const SPEED_INC   = 20;         // dulu 30

  // parallax dibikin lebih pelan
  const LAYER_SPEEDS = [0.05, 0.08, 0.12, 0.18, 0.26, 0.36];
  const PARALLAX_MULT = 0.10;     // dulu 0.15

  // obstacle spawn: lebih jarang + wajib jarak piksel minimal
  const SPAWN_MIN_MS = 1400;      // dulu 950
  const SPAWN_MAX_MS = 2200;      // dulu 1600
  const FIRST_SPAWN_DELAY = 1200; // jeda awal
  const MIN_GAP_PX = 480;         // jarak min antar obstacle (piksel layar)

  // ====== TITLE ======
  class Title extends Phaser.Scene {
    constructor(){ super('title'); }
    preload(){
      // Splash + preview
      this.load.image('splash', 'assets/splash_16x9.png');
      this.load.image('map_preview',  'assets/maps/city/map_city_preview.png');
      this.load.image('char_preview', 'assets/char_skater_preview.png');

      // Aset in-game (preload di sini biar transisi cepat)
      for (let i=1;i<=6;i++) this.load.image('city'+i, `assets/maps/city/city${i}.png`);
      this.load.spritesheet('skater', 'assets/skater_girl.png', { frameWidth:128, frameHeight:128 });
      this.load.image('ob_barrier',  'assets/obstacles/barrier.png');
      this.load.image('ob_barrier2', 'assets/obstacles/barrier2.png');
      this.load.image('ob_cone',     'assets/obstacles/cone.png');
    }
    create(){
      this.cameras.main.setBackgroundColor('#0f1418');

      // splash sebagai latar (sedikit diblur visualnya dengan opacity)
      const splash = this.add.image(W/2, H/2, 'splash');
      const s = Math.max(W / splash.width, H / splash.height);
      splash.setScale(s).setAlpha(0.18);

      // judul
      this.add.text(W/2, 70, 'Rialo Skater', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 46, color:'#E6F6EF'
      }).setOrigin(0.5,0.5);

      // preview map (kiri)
      const mapCard = this.add.rectangle(W*0.27, H*0.48, 460, 300, 0x0f1418, 0.6)
        .setStrokeStyle(2, 0x3BE0B6, 0.8);
      const mapImg = this.add.image(mapCard.x, mapCard.y, 'map_preview');
      const ms = Math.min(420 / mapImg.width, 260 / mapImg.height);
      mapImg.setScale(ms);
      this.add.text(mapCard.x, mapCard.y - mapCard.height/2 - 28, 'Map', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 22, color:'#9BEAC9'
      }).setOrigin(0.5,1);

      // preview karakter (kanan)
      const charCard = this.add.rectangle(W*0.73, H*0.48, 460, 300, 0x0f1418, 0.6)
        .setStrokeStyle(2, 0x3BE0B6, 0.8);
      const chImg = this.add.image(charCard.x, charCard.y, 'char_preview');
      const cs = Math.min(360 / chImg.width, 260 / chImg.height);
      chImg.setScale(cs);
      this.add.text(charCard.x, charCard.y - charCard.height/2 - 28, 'Character', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 22, color:'#9BEAC9'
      }).setOrigin(0.5,1);

      // tombol
      const btn = this.add.text(W/2, H - 90, 'SKATE!', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 30, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:24,y:12}
      }).setOrigin(0.5).setInteractive({useHandCursor:true});
      btn.on('pointerdown', () => this.scene.start('main'));
    }
  }

  // ====== GAME ======
  class Main extends Phaser.Scene {
    constructor(){ super('main'); }
    create(){
      this.speed = SPEED_START;
      this.score = 0;
      this.lives = 3;
      this.invincible = false;
      this.lastObstacleX = -99999; // buat kontrol jarak piksel minimal

      // --- PARALLAX (fix vertikal, lebih pelan)
      this.layers = [];
      for (let i=1;i<=6;i++){
        const key = 'city'+i;
        const tex = this.textures.get(key).getSourceImage();
        const scale = H / tex.height;
        const layer = this.add.tileSprite(0,0,W,H,key).setOrigin(0).setScrollFactor(0);
        layer.setTileScale(scale, scale);
        layer.tilePositionY = 0;
        this.layers.push(layer);
      }

      // --- GROUND ---
      const groundY = H - 96;
      const ground = this.add.rectangle(W/2, groundY, W, 10, 0x000000, 0);
      this.physics.add.existing(ground, true);

      // --- PLAYER ---
      this.player = this.physics.add.sprite(220, groundY-64, 'skater', 0);
      this.player.setCollideWorldBounds(true);
      this.player.setGravityY(GRAVITY_Y);
      this.player.setSize(60,90).setOffset(34,28);
      this.physics.add.collider(this.player, ground);

      // anim
      this.anims.create({ key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1,  repeat:-1 });
      this.anims.create({ key:'push',  frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
      this.anims.create({ key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0 });
      this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1,  repeat:0 });
      this.player.play('push');

      // input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.on('pointerdown', () => this.tryJump());

      // obstacles
      this.obstacles = this.physics.add.group();
      this.physics.add.collider(this.obstacles, ground);
      this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);

      // jadwal spawn (ada penundaan awal)
      this.time.delayedCall(FIRST_SPAWN_DELAY, () => this.scheduleNextSpawn());

      // UI
      this.scoreText = this.add.text(20, 20, 'Score: 0', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize: 26, color:'#E6F6EF'
      }).setDepth(10);
      this.livesText = this.add.text(W-26, 20, '♥♥♥', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize: 28, color:'#FF6B6B'
      }).setOrigin(1,0).setDepth(10);

      // speed up + score
      this.time.addEvent({ delay: SPEED_UP_EVERY_MS, loop:true,
        callback: () => this.speed = Math.min(SPEED_MAX, this.speed + SPEED_INC)
      });
      this.time.addEvent({ delay: 120, loop:true,
        callback: () => { this.score += 1; this.scoreText.setText('Score: '+this.score); }
      });
    }

    tryJump(){
      const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
      if (onFloor){
        this.player.setVelocityY(JUMP_VELOCITY);
        this.player.play('jump', true);
      }
    }

    scheduleNextSpawn(){
      const delay = Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS);
      this.time.delayedCall(delay, () => {
        this.spawnObstacle();
        this.scheduleNextSpawn();
      });
    }

    spawnObstacle(){
      // pastikan jarak piksel minimal terhadap obstacle terakhir
      if (this.lastObstacleX !== -99999) {
        const dist = (W) - this.lastObstacleX; // seberapa jauh obstacle terakhir pergi
        if (dist < MIN_GAP_PX) return;        // masih terlalu dekat, skip sekali
      }

      const keys = ['ob_barrier','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
      if (!keys.length) return;
      const key = Phaser.Utils.Array.GetRandom(keys);

      const ob = this.obstacles.create(W + 80, H - 108, key);
      ob.setOrigin(0.5,1).setImmovable(true).setVelocityX(-this.speed);
      ob.body.allowGravity = false;
      if (key === 'ob_cone') ob.body.setSize(42,52).setOffset((ob.width-42)/2, ob.height-52);

      this.lastObstacleX = ob.x;
    }

    onHit = () => {
      if (this.invincible) return;
      this.lives -= 1;
      this.updateLives();
      this.invincible = true;
      this.player.play('crash', true);
      this.tweens.add({
        targets:this.player, alpha:0.2, duration:100, yoyo:true, repeat:5,
        onComplete:()=>{ this.player.alpha=1; this.invincible=false;
          const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
          if (onFloor) this.player.play('push',true);
        }
      });
      if (this.lives <= 0) this.gameOver();
    }

    updateLives(){
      const s = '♥'.repeat(Math.max(0,this.lives));
      this.livesText.setText(s);
    }

    gameOver(){
      this.physics.world.pause();
      this.add.rectangle(W/2,H/2,W,H,0x000000,0.55).setDepth(20);
      this.add.text(W/2, H/2-40, 'Game Over', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize:56, color:'#FFFFFF'
      }).setOrigin(0.5).setDepth(21);
      this.add.text(W/2, H/2+10, `Score: ${this.score}`, {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize:24, color:'#9BEAC9'
      }).setOrigin(0.5).setDepth(21);
      const btn = this.add.text(W/2, H/2+70, 'Back to Title', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:22, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:18,y:8}
      }).setOrigin(0.5).setDepth(21).setInteractive({useHandCursor:true});
      btn.on('pointerdown', () => this.scene.start('title'));
    }

    update(_, delta=16){
      // parallax smooth (lebih pelan)
      for (let i=0;i<this.layers.length;i++){
        this.layers[i].tilePositionX += this.speed * LAYER_SPEEDS[i] * PARALLAX_MULT * (delta/16);
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up)){
        this.tryJump();
      }

      // sync speed & cleanup
      this.obstacles.children.iterate(ob => {
        if (!ob) return;
        if (ob.active) ob.setVelocityX(-this.speed);
        if (ob.x < -120) ob.destroy();
      });

      // balik anim lari saat mendarat
      const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
      if (onFloor && !this.invincible && this.player.anims.currentAnim?.key !== 'push'){
        this.player.play('push', true);
      }
    }
  }

  // ====== CONFIG ======
  const config = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: W,
    height: H,
    backgroundColor: '#0f1418',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    physics: { default:'arcade', arcade:{ gravity:{ y:0 }, debug:false } },
    scene: [Title, Main],
  };

  window.addEventListener('load', () => new Phaser.Game(config));
})();

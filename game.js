// game.js — Rialo Skater (title fix, fair jump, slower parallax, BGM, Share)

(() => {
  const W = 1280, H = 720;

  // ===== TUNING =====
  const GRAVITY_Y = 1650;
  const JUMP_VELOCITY = -680;     // lompat sedikit lebih tinggi & enak
  const INVINCIBLE_MS = 900;

  const SPEED_START = 160;        // lebih santai
  const SPEED_MAX   = 320;
  const SPEED_UP_EVERY_MS = 9000;
  const SPEED_INC   = 16;

  // parallax super pelan
  const LAYER_SPEEDS   = [0.03, 0.05, 0.08, 0.12, 0.18, 0.26];
  const PARALLAX_MULT  = 0.07;

  // obstacle lebih longgar
  const SPAWN_MIN_MS = 1600;
  const SPAWN_MAX_MS = 2600;
  const FIRST_SPAWN_DELAY = 1400;
  const MIN_GAP_PX = 600;         // jarak piksel minimal antar obstacle

  // ===== TITLE =====
  class Title extends Phaser.Scene {
    constructor(){ super('title'); }
    preload(){
      // visual
      this.load.image('splash', 'assets/splash_16x9.png');
      this.load.image('map_preview',  'assets/maps/city/map_city_preview.png');
      this.load.image('char_preview', 'assets/char_skater_preview.png');

      // audio (opsional)
      this.load.audio('bgm',   'assets/audio/bgm.mp3');
      this.load.audio('click', 'assets/audio/click.mp3');

      // in-game
      for (let i=1;i<=6;i++) this.load.image('city'+i, `assets/maps/city/city${i}.png`);
      this.load.spritesheet('skater', 'assets/skater_girl.png', { frameWidth:128, frameHeight:128 });
      this.load.image('ob_barrier',  'assets/obstacles/barrier.png');
      this.load.image('ob_barrier2', 'assets/obstacles/barrier2.png');
      this.load.image('ob_cone',     'assets/obstacles/cone.png');
    }
    create(){
      this.cameras.main.setBackgroundColor('#0f1418');

      // splash di belakang
      const splash = this.add.image(W/2, H/2, 'splash').setDepth(0).setAlpha(0.20);
      const s = Math.max(W/splash.width, H/splash.height);
      splash.setScale(s);

      // judul
      this.add.text(W/2, 86, 'Rialo Skater', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 48, color:'#E6F6EF'
      }).setOrigin(0.5).setDepth(2);

      // kartu preview MAP (kiri)
      const mapCard = this.add.rectangle(W*0.28, H*0.48, 460, 300, 0x0f1418, 0.55)
        .setStrokeStyle(2, 0x3BE0B6, 0.9).setDepth(1);
      const mapImg = this.add.image(mapCard.x, mapCard.y, 'map_preview').setDepth(1);
      mapCard.disableInteractive(); mapImg.disableInteractive(); // biar ga nutup input
      const ms = Math.min(420/mapImg.width, 260/mapImg.height); mapImg.setScale(ms);
      this.add.text(mapCard.x, mapCard.y - mapCard.height/2 - 26, 'Map', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 20, color:'#9BEAC9'
      }).setOrigin(0.5,1).setDepth(1);

      // kartu preview CHAR (kanan)
      const charCard = this.add.rectangle(W*0.72, H*0.48, 460, 300, 0x0f1418, 0.55)
        .setStrokeStyle(2, 0x3BE0B6, 0.9).setDepth(1);
      const chImg = this.add.image(charCard.x, charCard.y, 'char_preview').setDepth(1);
      charCard.disableInteractive(); chImg.disableInteractive();
      const cs = Math.min(360/chImg.width, 260/chImg.height); chImg.setScale(cs);
      this.add.text(charCard.x, charCard.y - charCard.height/2 - 26, 'Character', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 20, color:'#9BEAC9'
      }).setOrigin(0.5,1).setDepth(1);

      // tombol
      const btn = this.add.text(W/2, H - 104, 'SKATE!', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 30, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:24,y:12}
      }).setOrigin(0.5).setDepth(3).setInteractive({useHandCursor:true});

      // footer Powered by Rialo
      this.add.text(W/2, H - 28, 'Powered by Rialo', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 16, color:'#9BEAC9'
      }).setOrigin(0.5,1).setDepth(2);

      // musik: cue diputar nanti di scene main (biar looping bersih)
      this.soundClick = this.sound.get('click') || this.sound.add('click', {volume:0.7});

      btn.on('pointerdown', () => {
        this.soundClick?.play({seek:0});
        this.scene.start('main');
      });
    }
  }

  // ===== MAIN =====
  class Main extends Phaser.Scene {
    constructor(){ super('main'); }
    create(){
      this.speed = SPEED_START;
      this.score = 0;
      this.lives = 3;
      this.invincible = false;
      this.lastObstacleX = -99999;

      // BGM (aman kalau tidak ada file)
      if (!this.sound.get('bgm')) {
        try { this.bgm = this.sound.add('bgm', { loop:true, volume:0.35 }); this.bgm.play(); }
        catch { /* no audio file, ignore */ }
      } else {
        this.bgm = this.sound.get('bgm'); if (!this.bgm.isPlaying) this.bgm.play();
      }

      // PARALLAX
      this.layers = [];
      for (let i=1;i<=6;i++){
        const key = 'city'+i;
        const img = this.textures.get(key).getSourceImage();
        const sc = H / img.height;
        const t = this.add.tileSprite(0,0,W,H,key).setOrigin(0).setScrollFactor(0).setDepth(i);
        t.setTileScale(sc, sc); t.tilePositionY = 0; this.layers.push(t);
      }

      // ground
      const groundY = H - 96;
      const ground = this.add.rectangle(W/2, groundY, W, 10, 0x000000, 0).setDepth(10);
      this.physics.add.existing(ground, true);

      // player
      this.player = this.physics.add.sprite(220, groundY-64, 'skater', 0).setDepth(11);
      this.player.setCollideWorldBounds(true);
      this.player.setGravityY(GRAVITY_Y);
      // hitbox lebih “adil”: sedikit lebih ramping & pendek
      this.player.setSize(54,84).setOffset(37,30);
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

      // overlap dengan validasi “fair jump”
      this.physics.add.overlap(this.player, this.obstacles, (pl, ob) => {
        // jika pemain sudah jelas di atas obstacle => abaikan (clear)
        const playerBottom = pl.body.bottom;
        const obstacleTop  = ob.body.top;
        if (playerBottom <= obstacleTop - 6) return; // aman, tidak kena
        this.onHit();
      });

      // spawn
      this.time.delayedCall(FIRST_SPAWN_DELAY, () => this.scheduleNextSpawn());

      // UI
      this.scoreText = this.add.text(20, 18, 'Score: 0', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize: 26, color:'#E6F6EF'
      }).setDepth(20);
      this.livesText = this.add.text(W-26, 18, '♥♥♥', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize: 28, color:'#FF6B6B'
      }).setOrigin(1,0).setDepth(20);

      // timers
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
      // jaga jarak piksel minimal
      if (this.lastObstacleX !== -99999) {
        const dist = W - this.lastObstacleX;
        if (dist < MIN_GAP_PX) return;
      }
      const keys = ['ob_barrier','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
      if (!keys.length) return;
      const key = Phaser.Utils.Array.GetRandom(keys);

      const ob = this.obstacles.create(W + 80, H - 108, key).setDepth(11);
      ob.setOrigin(0.5,1).setImmovable(true);
      ob.body.allowGravity = false;
      // hitbox obstacle dirapikan
      if (key === 'ob_cone') ob.body.setSize(42, 52).setOffset((ob.width-42)/2, ob.height-52);
      else                   ob.body.setSize(ob.width*0.8, ob.height*0.85).setOffset(ob.width*0.1, ob.height*0.15);
      ob.setVelocityX(-this.speed);

      this.lastObstacleX = ob.x;
    }

    onHit(){
      if (this.invincible) return;
      this.lives -= 1; this.updateLives();
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
      this.livesText.setText('♥'.repeat(Math.max(0,this.lives)));
    }

    gameOver(){
      this.physics.world.pause();
      this.bgm?.stop();

      this.add.rectangle(W/2,H/2,W,H,0x000000,0.55).setDepth(30);
      this.add.text(W/2, H/2-52, 'Game Over', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize:56, color:'#FFFFFF'
      }).setOrigin(0.5).setDepth(31);
      this.add.text(W/2, H/2+0, `Score: ${this.score}`, {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial', fontSize:24, color:'#9BEAC9'
      }).setOrigin(0.5).setDepth(31);

      // tombol share ke X/Twitter
      const share = this.add.text(W/2, H/2+56, 'Share to X/Twitter', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:20, color:'#0F1720', backgroundColor:'#FFD166', padding:{x:16,y:8}
      }).setOrigin(0.5).setDepth(31).setInteractive({useHandCursor:true});
      share.on('pointerdown', () => {
        const text = encodeURIComponent(`Aku baru saja mencetak skor ${this.score} di Rialo Skater! 🛹`);
        const url  = encodeURIComponent(location.href);
        const tw   = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=RialoSkater,Rialo`;
        window.open(tw, '_blank');
      });

      const back = this.add.text(W/2, H/2+100, 'Back to Title', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:20, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:16,y:8}
      }).setOrigin(0.5).setDepth(31).setInteractive({useHandCursor:true});
      back.on('pointerdown', () => this.scene.start('title'));
    }

    update(_, dt=16){
      // parallax sangat pelan
      for (let i=0;i<this.layers.length;i++){
        this.layers[i].tilePositionX += this.speed * LAYER_SPEEDS[i] * PARALLAX_MULT * (dt/16);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up)){
        this.tryJump();
      }
      // sync speed + bersih-bersih
      this.obstacles.children.iterate(ob => {
        if (!ob) return;
        if (ob.active) ob.setVelocityX(-this.speed);
        if (ob.x < -140) ob.destroy();
      });
      // balik anim push saat mendarat
      const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
      if (onFloor && !this.invincible && this.player.anims.currentAnim?.key !== 'push'){
        this.player.play('push', true);
      }
    }
  }

  // ===== CONFIG =====
  const config = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: W, height: H,
    backgroundColor: '#0f1418',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    physics: { default:'arcade', arcade:{ gravity:{ y:0 }, debug:false } },
    scene: [Title, Main],
  };

  window.addEventListener('load', () => new Phaser.Game(config));
})();

// game.js — Rialo Skater (Title -> Game, parallax fix, lives, obstacles)

(() => {
  const W = 1280, H = 720;

  // ==== TUNING ====
  const GRAVITY_Y = 1600;
  const JUMP_VELOCITY = -620;
  const INVINCIBLE_MS = 900;

  const SPEED_START = 260;
  const SPEED_MAX   = 520;
  const SPEED_UP_EVERY_MS = 5000;
  const SPEED_INC   = 30;

  const SPAWN_MIN_MS = 950;
  const SPAWN_MAX_MS = 1600;

  const LAYER_SPEEDS = [0.12, 0.20, 0.32, 0.50, 0.72, 1.00];

  // ==== TITLE ====
  class Title extends Phaser.Scene {
    constructor(){ super('title'); }
    preload(){
      // splash untuk halaman pembuka
      this.load.image('splash', 'assets/splash_16x9.png');
      // muat lebih awal biar transisi cepat
      for (let i=1;i<=6;i++) this.load.image('city'+i, `assets/maps/city/city${i}.png`);
      this.load.spritesheet('skater', 'assets/skater_girl.png', { frameWidth:128, frameHeight:128 });
      this.load.image('ob_barrier',  'assets/obstacles/barrier.png');
      this.load.image('ob_barrier2', 'assets/obstacles/barrier2.png');
      this.load.image('ob_cone',     'assets/obstacles/cone.png');
    }
    create(){
      this.cameras.main.setBackgroundColor('#0f1418');
      const splash = this.add.image(W/2, H/2, 'splash');
      // scale splash agar pas 16:9
      const s = Math.max(W / splash.width, H / splash.height);
      splash.setScale(s);

      const btn = this.add.text(W/2, H - 120, 'SKATE!', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 32, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:22,y:12}
      }).setOrigin(0.5).setInteractive({useHandCursor:true});

      btn.on('pointerdown', () => this.scene.start('main'));
    }
  }

  // ==== GAME ====
  class Main extends Phaser.Scene {
    constructor(){ super('main'); }

    create(){
      this.speed = SPEED_START;
      this.score = 0;
      this.lives = 3;
      this.invincible = false;

      // --- PARALLAX (fix: scale tile supaya tidak repeat vertikal)
      this.layers = [];
      for (let i=1;i<=6;i++){
        const key = 'city'+i;
        const tex = this.textures.get(key).getSourceImage();
        const scale = H / tex.height;              // penting: samakan tinggi
        const layer = this.add.tileSprite(0,0,W,H,key)
          .setOrigin(0)
          .setScrollFactor(0);

        layer.setTileScale(scale, scale);          // <-- kunci anti dobel vertikal
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

      this.anims.create({ key:'idle', frames:[{key:'skater',frame:0}], frameRate:1, repeat:-1 });
      this.anims.create({ key:'push', frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
      this.anims.create({ key:'jump', frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0 });
      this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1, repeat:0 });
      this.player.play('push');

      // --- INPUT ---
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.on('pointerdown', () => this.tryJump());

      // --- OBSTACLES ---
      this.obstacles = this.physics.add.group();
      this.physics.add.collider(this.obstacles, ground);
      this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);
      this.scheduleNextSpawn();

      // --- UI ---
      this.scoreText = this.add.text(20, 20, 'Score: 0', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 26, color:'#E6F6EF'
      }).setDepth(10);

      this.livesText = this.add.text(W-26, 20, '♥♥♥', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize: 28, color:'#FF6B6B'
      }).setOrigin(1,0).setDepth(10);

      // Speed up + score
      this.time.addEvent({ delay: SPEED_UP_EVERY_MS, loop:true,
        callback: () => this.speed = Math.min(SPEED_MAX, this.speed + SPEED_INC)
      });
      this.time.addEvent({ delay: 100, loop:true,
        callback: () => { this.score += 1; this.scoreText.setText('Score: '+this.score); }
      });

      console.log('[Rialo] game started');
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
      this.time.delayedCall(delay, () => { this.spawnObstacle(); this.scheduleNextSpawn(); });
    }

    spawnObstacle(){
      const keys = ['ob_barrier','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
      if (!keys.length) return;
      const key = Phaser.Utils.Array.GetRandom(keys);

      const ob = this.obstacles.create(W + 80, H - 108, key);
      ob.setOrigin(0.5,1).setImmovable(true).setVelocityX(-this.speed);
      ob.body.allowGravity = false;
      if (key === 'ob_cone') ob.body.setSize(42,52).setOffset((ob.width-42)/2, ob.height-52);
    }

    onHit = () => {
      if (this.invincible) return;
      this.lives -= 1;
      this.updateLives();
      this.invincible = true;
      this.player.play('crash', true);
      this.tweens.add({
        targets:this.player, alpha:0.2, duration:100, yoyo:true, repeat:5,
        onComplete:()=>{ this.player.alpha=1; this.invincible=false; if (this.player.body?.blocked?.down) this.player.play('push',true); }
      });
      if (this.lives <= 0) this.gameOver();
    }

    updateLives(){
      const s = '♥'.repeat(Math.max(0,this.lives));
      this.livesText.setText(s);
    }

    gameOver(){
      this.physics.world.pause();
      const dim = this.add.rectangle(W/2,H/2,W,H,0x000000,0.55).setDepth(20);
      this.add.text(W/2, H/2-40, 'Game Over', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:56, color:'#FFFFFF'
      }).setOrigin(0.5).setDepth(21);
      this.add.text(W/2, H/2+10, `Score: ${this.score}`, {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:24, color:'#9BEAC9'
      }).setOrigin(0.5).setDepth(21);
      const btn = this.add.text(W/2, H/2+70, 'Restart', {
        fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Arial',
        fontSize:24, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:18,y:8}
      }).setOrigin(0.5).setDepth(21).setInteractive({useHandCursor:true});
      btn.on('pointerdown', () => this.scene.start('title'));
    }

    update(_, delta=16){
      // Parallax scroll (X only)
      for (let i=0;i<this.layers.length;i++){
        this.layers[i].tilePositionX += this.speed * LAYER_SPEEDS[i] * 0.15 * (delta/16);
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up)){
        this.tryJump();
      }

      // Sync speed & cleanup
      this.obstacles.children.iterate(ob => {
        if (!ob) return;
        if (ob.active) ob.setVelocityX(-this.speed);
        if (ob.x < -120) ob.destroy();
      });

      // Balik ke animasi lari saat mendarat
      const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
      if (onFloor && !this.invincible && this.player.anims.currentAnim?.key !== 'push'){
        this.player.play('push', true);
      }
    }
  }

  // ==== CONFIG ====
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

  window.addEventListener('load', () => {
    new Phaser.Game(config);
    console.log('[Rialo] Phaser', Phaser.VERSION, 'booted');
  });
})();

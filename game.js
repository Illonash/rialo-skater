// game.js — Rialo Skater (parallax + obstacles + lives)
// Pastikan struktur file:
//  assets/
//    maps/city/{city1.png ... city6.png, map_city_preview.png}
//    obstacles/{barrier.png, barrier2.png, cone.png}
//    skater_girl.png   <-- 1152x128 (9 frame x 128)

(() => {
  const W = 1280, H = 720;

  // --- Tuning gameplay ---
  const GRAVITY_Y = 1600;
  const JUMP_VELOCITY = -620;
  const INVINCIBLE_MS = 900;

  const SPEED_START = 260;      // kecepatan awal scroller & obstacle
  const SPEED_MAX   = 520;
  const SPEED_UP_EVERY_MS = 5000; // naik tiap 5 detik
  const SPEED_INC   = 30;

  const SPAWN_MIN_MS = 950;     // rentang spawn obstacle
  const SPAWN_MAX_MS = 1600;

  // Skala parallax (layer paling belakang paling lambat)
  const LAYER_SPEEDS = [0.12, 0.20, 0.32, 0.50, 0.72, 1.00];

  let game;

  class Preload extends Phaser.Scene {
    constructor(){ super('preload'); }

    preload(){
      // progress bar
      const bg = this.add.rectangle(W/2, H/2 + 120, 420, 10, 0x1d2831).setOrigin(0.5);
      const bar = this.add.rectangle(W/2 - 210, H/2 + 120, 2, 10, 0x46ecca).setOrigin(0,0.5);
      this.load.on('progress', p => bar.width = 2 + 416*p);

      // maps (parallax)
      for (let i=1;i<=6;i++){
        this.load.image('city'+i, `assets/maps/city/city${i}.png`);
      }

      // character spritesheet 9x 128x128
      this.load.spritesheet('skater', 'assets/skater_girl.png', {
        frameWidth: 128, frameHeight: 128
      });

      // obstacles
      this.load.image('ob_barrier',  'assets/obstacles/barrier.png');
      this.load.image('ob_barrier2', 'assets/obstacles/barrier2.png');
      this.load.image('ob_cone',     'assets/obstacles/cone.png');

      this.load.once('complete', () => this.scene.start('main'));
    }
  }

  class Main extends Phaser.Scene {
    constructor(){ super('main'); }

    create(){
      // WORLD & UI
      this.cameras.main.setBackgroundColor('#0f1418');
      this.speed = SPEED_START;
      this.score = 0;
      this.lives = 3;
      this.invincible = false;

      // --- PARALLAX tileSprite (fullscreen) ---
      // Asumsi sumber 576x324 → kita pakai tileSprite ukuran game (W x H) lalu scroll via tilePositionX
      this.layers = [];
      for (let i=1;i<=6;i++){
        const layer = this.add.tileSprite(0,0,W,H,'city'+i)
          .setOrigin(0).setScrollFactor(0);
        // scale agar tinggi pas — tileSprite pakai repeat texture, tak perlu scale ratio
        this.layers.push(layer);
      }

      // --- GROUND (tak terlihat) ---
      const groundY = H - 96; // ketinggian "jalan"
      const ground = this.add.rectangle(W/2, groundY, W, 10, 0x000000, 0);
      this.physics.add.existing(ground, true);
      this.groundCollider = ground;

      // --- PLAYER ---
      this.player = this.physics.add.sprite(220, groundY-64, 'skater', 0);
      this.player.setCollideWorldBounds(true);
      this.player.setGravityY(GRAVITY_Y);
      this.player.setSize(60, 90).setOffset(34, 28); // hitbox rapih
      this.physics.add.collider(this.player, ground);

      // Animations
      // 0: idle, 1-4: push (jalan), 5-7: jump, 8: crash
      this.anims.create({ key:'idle', frames:[{key:'skater',frame:0}], frameRate:1, repeat:-1 });
      this.anims.create({ key:'push', frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}), frameRate:10, repeat:-1 });
      this.anims.create({ key:'jump', frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}), frameRate:12, repeat:0 });
      this.anims.create({ key:'crash', frames:[{key:'skater',frame:8}], frameRate:1, repeat:0 });

      this.player.play('push');

      // --- INPUT ---
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.input.on('pointerdown', () => this.tryJump());

      // --- OBSTACLES ---
      this.obstacles = this.physics.add.group();
      this.physics.add.collider(this.obstacles, ground);
      this.physics.add.overlap(this.player, this.obstacles, this.onHit, null, this);

      this.scheduleNextSpawn();

      // --- UI ---
      this.scoreText = this.add.text(20, 20, 'Score: 0', {
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 26, color:'#E6F6EF'
      }).setScrollFactor(0).setDepth(10);

      this.livesText = this.add.text(W-26, 20, '♥♥♥', {
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 28, color:'#FF6B6B'
      }).setOrigin(1,0).setDepth(10);

      // --- SPEED UP timer ---
      this.speedTimer = this.time.addEvent({
        delay: SPEED_UP_EVERY_MS, loop: true,
        callback: () => {
          this.speed = Math.min(SPEED_MAX, this.speed + SPEED_INC);
        }
      });

      // Skor naik dengan waktu
      this.scoreTimer = this.time.addEvent({
        delay: 100, loop: true,
        callback: () => { this.score += 1; this.scoreText.setText('Score: ' + this.score); }
      });

      // DEBUG minimal di console
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
      this.time.delayedCall(delay, () => {
        this.spawnObstacle();
        this.scheduleNextSpawn();
      });
    }

    spawnObstacle(){
      // pilih salah satu jenis
      const pool = ['ob_barrier','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
      if (pool.length === 0) { console.warn('[Rialo] obstacle textures missing'); return; }
      const key = Phaser.Utils.Array.GetRandom(pool);

      const y = H - 108; // atas ground sedikit
      const x = W + 80;

      const ob = this.obstacles.create(x, y, key);
      ob.setOrigin(0.5,1);
      ob.setImmovable(true);
      ob.setVelocityX(-this.speed);
      // sedikit variasi skala/offset antar obst
      if (key === 'ob_cone') {
        ob.setScale(1.0);
        ob.body.setSize(42, 52).setOffset((ob.width-42)/2, ob.height-52);
      } else {
        ob.setScale(1.0);
      }

      // auto destroy saat keluar layar
      ob.setActive(true);
      ob.checkWorldBounds = true;
      ob.outOfBoundsKill = true;
      ob.body.allowGravity = false;
    }

    onHit(player, obstacle){
      if (this.invincible) return;

      this.lives -= 1;
      this.updateLives();
      this.invincible = true;
      player.play('crash', true);
      this.tweens.add({
        targets: player, alpha: 0.2, duration: 100, yoyo: true, repeat: 5,
        onComplete: () => { player.alpha = 1; this.invincible = false; }
      });

      if (this.lives <= 0){
        this.gameOver();
      } else {
        // lanjut jalan
        this.time.delayedCall(300, () => {
          if (player.body?.blocked?.down) player.play('push', true);
        });
      }
    }

    updateLives(){
      const hearts = ['','',''];
      for (let i=0; i<this.lives; i++) hearts[i] = '♥';
      this.livesText.setText(hearts.join(''));
    }

    gameOver(){
      this.physics.world.pause();
      this.speedTimer?.remove();
      this.scoreTimer?.remove();

      const dim = this.add.rectangle(W/2,H/2,W,H,0x000000,0.55).setDepth(20);
      this.add.text(W/2, H/2 - 40, 'Game Over', {
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 56, color:'#FFFFFF'
      }).setOrigin(0.5).setDepth(21);

      this.add.text(W/2, H/2 + 10, `Score: ${this.score}`, {
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 24, color:'#9BEAC9'
      }).setOrigin(0.5).setDepth(21);

      const btn = this.add.text(W/2, H/2 + 70, 'Restart', {
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 24, color:'#0F1720', backgroundColor:'#46ECCA', padding:{x:18,y:8}
      }).setOrigin(0.5).setDepth(21).setInteractive({useHandCursor:true});
      btn.on('pointerdown', () => this.scene.restart());
    }

    update(time, delta){
      // Parallax scroll
      const d = (delta || 16) / 16;
      for (let i=0;i<this.layers.length;i++){
        this.layers[i].tilePositionX += this.speed * LAYER_SPEEDS[i] * 0.15 * d;
      }

      // Input jump
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.tryJump();
      }

      // Animasi lari saat di tanah
      const onFloor = this.player.body?.blocked?.down || this.player.body?.touching?.down;
      if (onFloor && !this.invincible && this.player.anims.currentAnim?.key !== 'push'){
        this.player.play('push', true);
      }

      // Sinkronkan kecepatan obstacle (biar makin cepat seiring waktu)
      this.obstacles.children.iterate(ob => {
        if (ob && ob.active) ob.setVelocityX(-this.speed);
        if (ob && ob.active && ob.x < -120) ob.destroy();
      });
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: W,
    height: H,
    backgroundColor: '#0f1418',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [Preload, Main],
  };

  window.addEventListener('load', () => {
    try {
      game = new Phaser.Game(config);
      console.log('[Rialo] Phaser', Phaser.VERSION, 'booted');
    } catch (e) {
      console.error('Phaser init failed:', e);
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#9BEAC9;font:600 20px system-ui;background:#0f1418';
      d.textContent = 'Phaser gagal inisialisasi. Cek console.';
      document.body.appendChild(d);
    }
  });
})();

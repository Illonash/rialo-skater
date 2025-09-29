// ==== tweak cepat di atas file (boleh dipindah ke bagian konstanta kamu) ====
const SKY_COLOR    = '#13A9DB'; // warna langit (isi area di atas skyline)
const GROUND_RATIO = 0.62;      // tinggi ground relatif layar (0.0 - 1.0)
const PLAYER_X     = 160;       // posisi X awal pemain
const PLAYER_FLOOR_OFFSET = 58; // berapa px badan pemain “nongol” di atas ground
const OB_SCALE     = 0.85;      // skala obstacle agar sedikit lebih kecil
// ============================================================================

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    // Parallax (pakai satu layer utama sebagai skyline)
    this.load.image('city6', 'assets/maps/city/city6.png');

    // Obstacles
    this.load.image('obs_barrier',  'assets/obstacles/barrier.png');
    this.load.image('obs_barrier2', 'assets/obstacles/barrier2.png');
    this.load.image('obs_cone',     'assets/obstacles/cone.png');

    // Skater (9 frame @ 128x128)
    this.load.spritesheet('skater', 'assets/skater_girl.png', {
      frameWidth: 128, frameHeight: 128, endFrame: 8
    });

    // Musik kalau ada
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
  }

  create() {
    // ----- Latar & ukuran dunia
    this.cameras.main.setBackgroundColor(SKY_COLOR);
    this.groundY = Math.round(GAME_H * GROUND_RATIO);

    // Skyline: ditempel ke bawah, selebar layar
    this.skyline = this.add.tileSprite(0, this.groundY, GAME_W, this.groundY, 'city6')
      .setOrigin(0, 1); // nempel bawah

    // opsional: garis ground tipis untuk visual lantai
    this.add.rectangle(0, this.groundY, GAME_W, 4, 0x0e8ac2, 0.85).setOrigin(0, 1);

    // Physics world cukup setinggi layar
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);

    // ----- Player
    this.player = this.physics.add.sprite(PLAYER_X, this.groundY - PLAYER_FLOOR_OFFSET, 'skater', 1);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y);
    // hitbox lebih fair
    this.player.body.setSize(60, 80).setOffset(34, 36);

    // Animasi
    this.anims.create({ key: 'ride',  frames: this.anims.generateFrameNumbers('skater', { start: 1, end: 4 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump',  frames: this.anims.generateFrameNumbers('skater', { start: 5, end: 7 }), frameRate: 12 });
    this.anims.create({ key: 'idle',  frames: [{ key: 'skater', frame: 0 }], frameRate: 1 });
    this.anims.create({ key: 'crash', frames: [{ key: 'skater', frame: 8 }], frameRate: 1 });

    this.player.play('ride');

    // Kontrol (klik & keyboard)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.tryJump()); // mouse/touch

    // ----- UI Score & Lives
    this.score = 0;
    this.lives = MAX_LIVES;

    this.scoreText = this.add.text(18, 18, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif', fontSize: '32px', color: '#ffffff'
    });

    this.hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const t = this.add.text(GAME_W - 24 - i * 28, 18, '❤', { fontSize: '28px' })
        .setTint(i === 0 ? 0xff6b81 : 0xff6b81).setOrigin(1, 0);
      this.hearts.push(t);
    }

    // ----- Obstacles
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleHit, null, this);

    // Spawn pertama & skor jalan
    this.isGameOver = false;
    this.invulnUntil = 0;
    this.doubleJumpLeft = 1;

    this.time.addEvent({
      delay: 150, loop: true,
      callback: () => { if (!this.isGameOver) { this.score += 1; this.scoreText.setText(`Score: ${this.score}`); } }
    });

    this.scheduleNextObstacle();

    // Musik aman bila ada
    try { if (this.cache.audio.exists('bgm')) this.sound.add('bgm', { loop: true, volume: 0.35 }).play(); } catch {}

    // Reset double jump saat menyentuh “tanah imajiner”
    this.physics.world.on('worldstep', () => {
      if (!this.isGameOver && this.isOnGround()) this.doubleJumpLeft = 1;
    });
  }

  // ---------- Helpers
  isOnGround() {
    // anggap mendarat saat pos Y >= groundY - offset
    return this.player.y >= (this.groundY - PLAYER_FLOOR_OFFSET) - 1 && this.player.body.velocity.y >= 0;
  }

  scheduleNextObstacle() {
    const delay = Phaser.Math.Between(OBST_MIN_DELAY, OBST_MAX_DELAY);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    const keys = ['obs_barrier', 'obs_barrier2', 'obs_cone'];
    const key = Phaser.Utils.Array.GetRandom(keys);

    // posisi bawah obstacle tepat di ground
    const o = this.obstacles.create(GAME_W + 40, this.groundY, key);
    o.setOrigin(0.5, 1);
    o.setScale(OB_SCALE);
    o.body.allowGravity = false;
    o.setImmovable(true);

    // hitbox proporsional
    const bw = o.width  * OB_SCALE;
    const bh = o.height * OB_SCALE;
    o.body.setSize(bw * 0.7, bh * 0.6).setOffset((o.width - bw) / 2 + bw * 0.15, (o.height - bh) / 2 + bh * 0.4);

    // kecepatan mendekat
    o.setVelocityX(-BASE_SPEED);

    // auto-hapus jika lewat layar
    o.checkWorldBounds = true;
    o.outOfBoundsKill = true;

    this.scheduleNextObstacle();
  }

  tryJump() {
    if (this.isGameOver) return;

    // tombol keyboard (space/up) juga bisa
    if (this.cursors.space?.isDown || this.cursors.up?.isDown) {
      // biarkan event pointerdown juga memakai fungsi yang sama
    }

    if (this.isOnGround()) {
      this.player.setY(this.groundY - PLAYER_FLOOR_OFFSET); // jaga “nempel”
      this.player.setVelocityY(JUMP_VELOCITY);
      this.player.play('jump', true);
      this.doubleJumpLeft = 1; // setelah takeoff, masih sisa 1 kali
    } else if (this.doubleJumpLeft > 0) {
      this.doubleJumpLeft--;
      this.player.setVelocityY(JUMP_VELOCITY * 0.92);
      this.player.play('jump', true);
    }
  }

  handleHit(player, obstacle) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.isGameOver) return;

    this.lives -= 1;
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));

    player.play('crash', true);
    player.setTint(0xff8080);
    this.invulnUntil = now + 900;
    this.time.delayedCall(180, () => player.clearTint());
    this.time.delayedCall(200, () => { if (!this.isGameOver) player.play('ride'); });

    if (this.lives <= 0) this.gameOver();
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // hentikan dunia
    this.obstacles.children.iterate(o => o && o.setVelocityX(0));
    this.player.setVelocity(0, 0).play('crash');
    this.player.body.allowGravity = false;

    // overlay
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0);

    const panel = this.add.rectangle(GAME_W / 2, GAME_H / 2, 560, 280, 0x0f172a, 0.96)
      .setStrokeStyle(6, 0x22e3a3);

    this.add.text(GAME_W / 2, panel.y - 80, 'Game Over', {
      fontFamily: 'system-ui, sans-serif', fontSize: '52px', color: '#e3f2fd', fontStyle: '900'
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, panel.y - 20, `Score: ${this.score}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#b2ebf2'
    }).setOrigin(0.5);

    const btnR = this.add.rectangle(GAME_W / 2 - 120, panel.y + 70, 200, 56, 0x22e3a3)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor: 'pointer' });
    this.add.text(btnR.x, btnR.y, 'Restart', { fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontStyle: '800', color: '#061016' }).setOrigin(0.5);

    const btnS = this.add.rectangle(GAME_W / 2 + 120, panel.y + 70, 200, 56, 0x1DA1F2)
      .setStrokeStyle(4, 0x061016).setInteractive({ cursor: 'pointer' });
    this.add.text(btnS.x, btnS.y, 'Share', { fontFamily: 'system-ui, sans-serif', fontSize: '24px', fontStyle: '800', color: '#ffffff' }).setOrigin(0.5);

    btnR.on('pointerup', () => this.scene.restart());
    btnS.on('pointerup', () => {
      const text = encodeURIComponent(`Skor gue di Rialo Skater: ${this.score}! 🛹`);
      const url  = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&via=Rialo`, '_blank');
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Geser tile skyline (parallax pelan)
    this.skyline.tilePositionX += 24 * dt; // 24px/detik

    // Keyboard jump (space / panah atas)
    if (!this.isGameOver && (this.cursors.space?.justDown || this.cursors.up?.justDown)) {
      this.tryJump();
    }

    // Kembalikan animasi ride saat mendarat
    if (!this.isGameOver && this.isOnGround() && this.player.anims.currentAnim?.key === 'jump') {
      this.player.play('ride');
    }

    // Bersihkan obstacle jauh di luar layar
    this.obstacles.children.iterate(o => { if (o && o.x < -120) o.destroy(); });
  }
}

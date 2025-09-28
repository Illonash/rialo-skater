// game.js — SANITY MODE (anti-blank)
(() => {
  const W = 1280, H = 720;

  class Boot extends Phaser.Scene {
    constructor(){ super('boot'); }

    preload(){
      // --- DEBUG BAR (biar kelihatan hidup) ---
      const barBg = this.add.rectangle(W/2, H/2 + 120, 420, 10, 0x1f2a33).setOrigin(0.5);
      const bar   = this.add.rectangle(W/2 - 210, H/2 + 120, 2, 10, 0x46ecca).setOrigin(0,0.5);
      this.load.on('progress', p => bar.width = 2 + 416*p);

      // --- COBA LOAD 2 GAMBAR YANG ADA DI REPO KAMU ---
      // Map preview (assets/maps/city/map_city_preview.png)
      this.load.image('map_prev', 'assets/maps/city/map_city_preview.png');
      // Satu obstacle (assets/obstacles/barrier.png)
      this.load.image('ob_barrier', 'assets/obstacles/barrier.png');

      // Log sukses/gagal
      this.load.on('filecomplete-image-map_prev', () => console.log('[LOAD OK] map_prev'));
      this.load.on('filecomplete-image-ob_barrier', () => console.log('[LOAD OK] ob_barrier'));
      this.load.on('loaderror', (file) => console.warn('[LOAD ERR]', file?.src || file?.key || file));

      // (opsional) timeout safety supaya gak nyangkut kalau ada yang aneh
      this.time.delayedCall(8000, () => {
        if (!this.textures.exists('map_prev') && !this.textures.exists('ob_barrier')) {
          console.warn('[TIMEOUT] Textures belum masuk, lanjut ke scene tetap.');
          this.scene.start('main');
        }
      });
    }

    create(){
      // Lanjut ke scene utama setelah preload selesai
      this.scene.start('main');
    }
  }

  class Main extends Phaser.Scene {
    constructor(){ super('main'); }

    create(){
      // Background solid (ANTI BLANK)
      this.cameras.main.setBackgroundColor('#0f1418');

      // Judul + status
      const title = this.add.text(W/2, H/2 - 60, 'Rialo Skater — Sanity Check', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 36, color: '#E6F6EF'
      }).setOrigin(0.5);

      let status = 'Phaser OK';
      // Tampilkan preview map jika ada
      if (this.textures.exists('map_prev')) {
        const img = this.add.image(W/2, H/2 + 40, 'map_prev').setScale(0.5).setAlpha(0.95);
        status += ' • map preview loaded';
      } else {
        status += ' • map preview MISS (cek path)';
      }

      // Tampilkan obstacle contoh jika ada
      if (this.textures.exists('ob_barrier')) {
        this.add.image(W/2 - 280, H/2 + 140, 'ob_barrier').setScale(1.2);
        status += ' • barrier loaded';
      } else {
        // fallback bentuk kotak supaya tetap kelihatan
        this.add.rectangle(W/2 - 280, H/2 + 140, 64, 48, 0xff4d4d).setStrokeStyle(2, 0x111111);
        status += ' • barrier MISS (cek path)';
      }

      this.add.text(W/2, H/2 + 220, status, {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 22, color: '#9BEAC9'
      }).setOrigin(0.5);

      // Info kecil
      this.add.text(W/2, H - 28, 'Tips: buka di Incognito agar error extension wallet tidak mengganggu console', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
        fontSize: 14, color: '#7aa49a'
      }).setOrigin(0.5);

      console.log('[SANITY] textures:', {
        map_prev: this.textures.exists('map_prev'),
        ob_barrier: this.textures.exists('ob_barrier')
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
    scene: [Boot, Main],
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }
  };

  window.addEventListener('load', () => {
    try {
      new Phaser.Game(config);
      console.log('Phaser v' + Phaser.VERSION, 'booted.');
    } catch (e) {
      console.error('Phaser init failed:', e);
      // fallback text di DOM kalau benar-benar gagal
      const d = document.createElement('div');
      d.className = 'fallback';
      d.textContent = 'Phaser gagal inisialisasi. Lihat console untuk detail.';
      document.body.appendChild(d);
    }
  });
})();

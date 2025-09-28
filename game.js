// game.js — sanity check
const WIDTH = 1280, HEIGHT = 720;

class TestScene extends Phaser.Scene {
  constructor(){ super('test'); }
  preload(){
    // (opsional) coba load satu gambar yang PASTI ada
    this.load.image('map_prev', 'assets/maps/city/map_city_preview.png');
  }
  create(){
    this.cameras.main.setBackgroundColor('#0f1418');
    const cx = this.cameras.main.centerX, cy = this.cameras.main.centerY;

    let ok = 'Phaser OK';
    if (this.textures.exists('map_prev')) {
      this.add.image(cx, cy - 60, 'map_prev').setScale(0.5);
      ok += ' • image loaded';
    } else {
      ok += ' • image MISS (cek path)';
    }

    this.add.text(cx, cy + 40, ok, {
      fontFamily: 'system-ui', fontSize: 32, color: '#9BEAC9'
    }).setOrigin(0.5);

    console.log('[SANITY] textures(map_prev)=', this.textures.exists('map_prev'));
  }
}

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0f1418',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  scene: [TestScene],
};

window.addEventListener('load', ()=> new Phaser.Game(config));

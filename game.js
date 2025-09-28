console.log('GAME.JS LOADED ✅');

// Buat 1 scene sederhana untuk ngetes loading file eksternal
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#1d2733',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 450
  },
  scene: {
    create() {
      const cx = this.scale.width / 2;
      const cy = this.scale.height / 2;

      // UI sederhana biar jelas kalau sukses
      this.add.text(cx, cy - 30, 'Game.js OK', {
        fontFamily: 'system-ui',
        fontSize: 36,
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 18, 'Phaser loaded • external script loaded', {
        fontFamily: 'system-ui',
        fontSize: 16,
        color: '#b8c0cc'
      }).setOrigin(0.5);

      // Biar kelihatan resize/scale-nya pas
      this.add.rectangle(cx, this.scale.height - 12, this.scale.width * 0.8, 4, 0x35e1a1).setOrigin(0.5, 1);
    }
  }
});

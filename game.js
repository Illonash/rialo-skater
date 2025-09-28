/* ========= RIALO SKATER — game.js ========= */
const WIDTH = 1280, HEIGHT = 720;
const STORAGE_KEY = 'rialo_skater_leaderboard_v1';

/* ---------------- Boot ---------------- */
class Boot extends Phaser.Scene {
  constructor(){ super('boot'); }
  preload(){
    // log error load biar gampang debug kalau ada 404
    this.load.on('loaderror', (file) => console.warn('LOAD ERROR:', file?.key, file?.src));

    // karakter (9 frame @128x128)
    this.load.spritesheet('skater', 'assets/skater_girl.png', {
      frameWidth: 128, frameHeight: 128
    });

    // UI / Splash / Preview
    this.load.image('splash', 'assets/splash_16x9.png');
    this.load.image('char_preview', 'assets/char_skater_preview.png');
    this.load.image('map_city_preview', 'assets/maps/city/map_city_preview.png');

    // Parallax city 6 layer
    for (let i = 1; i <= 6; i++){
      this.load.image(`city${i}`, `assets/maps/city/city${i}.png`);
    }

    // Obstacles (perhatikan ejaan barier*)
    this.load.image('ob_barrier1', 'assets/obstacles/barrier.png');
    this.load.image('ob_barrier2', 'assets/obstacles/barrier2.png');
    this.load.image('ob_cone',     'assets/obstacles/cone.png');
  }
  create(){ this.scene.start('splash'); }
}

/* --------------- Splash --------------- */
class Splash extends Phaser.Scene {
  constructor(){ super('splash'); }
  create(){
    const cx = WIDTH/2, cy = HEIGHT/2;
    if (this.textures.exists('splash')){
      const img = this.add.image(cx, cy, 'splash').setOrigin(0.5);
      const s = Math.max(WIDTH/img.width, HEIGHT/img.height);
      img.setScale(s);
    } else {
      this.cameras.main.setBackgroundColor('#11161c');
      this.add.text(cx, cy-60, 'Rialo Skater', {
        fontFamily:'system-ui', fontSize:48, color:'#fff', fontStyle:'bold'
      }).setOrigin(0.5);
      this.add.text(cx, cy-18, 'Rethink • Rebuild • Rialo', {
        fontFamily:'system-ui', fontSize:20, color:'#b8c0cc'
      }).setOrigin(0.5);
    }

    const btn = this.add.rectangle(cx, cy+210, 240, 64, 0xFFC62E)
      .setInteractive({useHandCursor:true});
    this.add.text(btn.x, btn.y, 'PLAY', {
      fontFamily:'system-ui', fontSize:26, color:'#111', fontStyle:'bold'
    }).setOrigin(0.5);

    btn.on('pointerup', () => this.scene.start('menu'));
    this.input.keyboard.on('keydown', e => {
      if (e.code === 'Enter' || e.code === 'Space') this.scene.start('menu');
    });
  }
}

/* ---------------- Menu ---------------- */
class Menu extends Phaser.Scene{
  constructor(){ super('menu'); }
  create(){
    this.cameras.main.setBackgroundColor('#0f1216');
    const F = 'system-ui';
    const marginX = 40, gap = 40;
    const colW = (WIDTH - marginX*2 - gap)/2;
    const leftX = marginX + colW/2, rightX = WIDTH - marginX - colW/2;

    // Map preview (kiri)
    this.add.text(leftX, 70, 'City', {fontFamily:F, fontSize:24, color:'#fff'}).setOrigin(0.5,1);
    this.add.rectangle(leftX, 330, colW, 280, 0x11161c).setStrokeStyle(2,0x2c3440);
    const mp = this.add.image(leftX, 330, 'map_city_preview').setOrigin(0.5);
    const mpImg = this.textures.get('map_city_preview').getSourceImage();
    if (mpImg) mp.setScale(Math.min((colW-20)/mpImg.width, (280-20)/mpImg.height));

    // Character preview (kanan)
    this.add.text(rightX, 70, 'Skater Girl', {fontFamily:F, fontSize:24, color:'#fff'}).setOrigin(0.5,1);
    this.add.rectangle(rightX, 315, colW, 320, 0x11161c).setStrokeStyle(2,0x2c3440);
    const ch = this.add.image(rightX, 315, 'char_preview').setOrigin(0.5);
    const chImg = this.textures.get('char_preview').getSourceImage();
    if (chImg) ch.setScale(Math.min((colW*0.78)/chImg.width, (320*0.78)/chImg.height));
    this.add.rectangle(rightX, 315, colW+4, 320+4).setStrokeStyle(4,0x35e1a1);

    // Tombol
    const btn = this.add.rectangle(WIDTH/2, HEIGHT-90, 260, 64, 0x35e1a1)
      .setInteractive({useHandCursor:true});
    this.add.text(btn.x, btn.y, 'SKATE!', {
      fontFamily:F, fontSize:26, color:'#111', fontStyle:'bold'
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('game'));
    this.input.keyboard.on('keydown', e => {
      if (e.code === 'Enter' || e.code === 'Space') this.scene.start('game');
    });
  }
}

/* ---------------- Game ---------------- */
class Game extends Phaser.Scene{
  constructor(){ super('game'); }

  create(){
    // Parallax layers
    this.layers = [];
    const base = [0.06,0.10,0.20,0.35,0.55,0.80];
    for (let i=1;i<=6;i++){
      const key = `city${i}`;
      const ts = this.add.tileSprite(0,0,WIDTH,HEIGHT,key).setOrigin(0,0);
      const img = this.textures.get(key).getSourceImage();
      const sc = Math.max(WIDTH/img.width, HEIGHT/img.height);
      ts.setTileScale(sc, sc);
      this.layers.push({ts, base:base[i-1], speed:base[i-1]});
    }

    // World & ground
    this.physics.world.setBounds(0,0,Number.MAX_SAFE_INTEGER/4, HEIGHT);
    this.groundY = HEIGHT - 90;

    // Player
    this.player = this.physics.add.sprite(220, this.groundY-60, 'skater', 0)
      .setScale(1.2).setDepth(20);
    this.player.setCollideWorldBounds(true);

    // Anim
    this.anims.create({key:'idle',  frames:[{key:'skater',frame:0}], frameRate:1,  repeat:-1});
    this.anims.create({key:'run',   frames:this.anims.generateFrameNumbers('skater',{start:1,end:3}), frameRate:12, repeat:-1});
    this.anims.create({key:'jump',  frames:this.anims.generateFrameNumbers('skater',{start:5,end:6}), frameRate:12, repeat:0});
    this.anims.create({key:'crash', frames:[{key:'skater',frame:8}], frameRate:1,  repeat:0});
    this.player.play('run');

    // HUD
    this.hp = 3; this.invul = false; this.score = 0;
    this.baseSpeed = 120; this.speed = this.baseSpeed;
    this.scoreText = this.add.text(20,18,'Score: 0',{fontFamily:'system-ui',fontSize:24,color:'#fff'}).setScrollFactor(0);
    this.hpText    = this.add.text(WIDTH-20,18,'♥♥♥',{fontFamily:'system-ui',fontSize:28,color:'#ff5a6a'})
                          .setOrigin(1,0).setScrollFactor(0);

    // Groups
    this.obstacles = this.physics.add.group();
    this.gems      = this.physics.add.group();

    // Spawner
    this.obTimer  = this.time.addEvent({ delay: 2000, loop:true, callback:()=>this.spawnObstacle() });
    this.gemTimer = this.time.addEvent({ delay: 1300, loop:true, callback:()=>this.spawnGem() });
    this.time.addEvent({ delay: 25000, loop:true, callback:()=>this.increaseDifficulty() });

    // Collider
    this.physics.add.collider(this.player, this.obstacles, () => this.onHitObstacle());

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', () => this.jump());

    // Garis ground visual (opsional)
    this.add.rectangle(WIDTH/2, this.groundY+1, WIDTH, 2, 0x000000, 0.25)
        .setScrollFactor(0).setDepth(5);
  }

  increaseDifficulty(){
    this.speed += 12;
    const f = this.speed/this.baseSpeed;
    this.layers.forEach(l => l.speed = l.base * f);
    const newDelay = Phaser.Math.Clamp(2200 - (this.speed-this.baseSpeed)*2, 1500, 2400);
    this.obTimer.reset({ delay:newDelay, loop:true, callback:()=>this.spawnObstacle() });
  }

  jump(){
    // pakai onFloor “simulasi”: kalau cukup dekat tanah, anggap di tanah
    if (this.player.y >= this.groundY-60 - 2 && this.player.body.velocity.y >= -5){
      this.player.setVelocityY(-520);
      this.player.play('jump', true);
    }
  }

  update(time, delta){
    const dt = delta/1000;

    // jalan otomatis
    this.player.setVelocityX(this.speed);

    // parallax jalan
    this.layers.forEach(l => l.ts.tilePositionX += l.speed * (dt*60));

    // skor
    this.score += dt * Math.round(this.speed/8);
    this.scoreText.setText('Score: ' + Math.floor(this.score));

    // input keyboard
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up)){
      this.jump();
    }

    // bersihkan entity lama
    this.obstacles.children.iterate(o => { if (o && o.x < -140) o.destroy(); });
    this.gems.children.iterate(g => { if (g && g.x < -80) g.destroy(); });

    // ambil gem
    this.physics.overlap(this.player, this.gems, (p, g) => {
      g.destroy(); this.score += 15;
    });

    // paksa pos Y di atas ground (tanpa platform fisik)
    if (this.player.y > this.groundY-60){
      this.player.y = this.groundY-60;
      if (this.player.anims.currentAnim?.key !== 'run' && !this.invul){
        this.player.play('run', true);
      }
    }
  }

  spawnObstacle(){
    const keys = ['ob_barrier1','ob_barrier2','ob_cone'].filter(k => this.textures.exists(k));
    const key  = keys.length ? Phaser.Utils.Array.GetRandom(keys) : null;

    const x = WIDTH + 120;
    const y = this.groundY;

    let ob;
    if (key){
      ob = this.add.image(x, y, key).setOrigin(0.5,1).setDepth(15);
      this.physics.add.existing(ob);
      ob.body.setAllowGravity(false).setImmovable(true);
    } else {
      // fallback (kalau asset belum ada)
      const shape = Phaser.Utils.Array.GetRandom([{w:48,h:60,c:0xD94848},{w:64,h:28,c:0xE3C833}]);
      ob = this.add.rectangle(x, y, shape.w, shape.h, shape.c).setOrigin(0.5,1).setDepth(15);
      this.physics.add.existing(ob);
      ob.body.setAllowGravity(false).setImmovable(true);
    }
    ob.body.setVelocityX(-this.speed);
    this.obstacles.add(ob);
  }

  spawnGem(){
    const y = this.groundY - 120 - Math.random()*120;
    const x = WIDTH + 80;
    const c = this.add.circle(x, y, 10, 0x35e1a1).setDepth(12);
    this.physics.add.existing(c);
    c.body.setVelocityX(-this.speed).setAllowGravity(false);
    this.gems.add(c);
  }

  onHitObstacle(){
    if (this.invul) return;

    this.hp -= 1;
    this.hpText.setText('♥'.repeat(this.hp)).setColor('#ff5a6a');
    this.player.play('crash', true);
    this.player.setTint(0xff6666);
    this.cameras.main.shake(120, 0.003);

    if (this.hp <= 0){
      this.player.setVelocity(0);
      this.time.delayedCall(600, () => this.scene.start('over', {score:Math.floor(this.score)}));
      return;
    }
    // invulnerability singkat
    this.invul = true;
    this.time.delayedCall(280, () => this.player.play('run', true));
    this.tweens.add({ targets:this.player, alpha:0.3, yoyo:true, repeat:6, duration:90 });
    this.time.delayedCall(1100, () => { this.invul = false; this.player.clearTint(); this.player.alpha = 1; });
  }
}

/* ------------- Game Over ------------- */
class Over extends Phaser.Scene{
  constructor(){ super('over'); }
  init(d){ this.final = d.score||0; }
  create(){
    const cx=WIDTH/2, cy=HEIGHT/2;
    this.cameras.main.setBackgroundColor('#101010');
    this.add.text(cx,cy-120,'Game Over',{fontFamily:'system-ui',fontSize:54,color:'#fff',fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(cx,cy-60,`Score: ${this.final}`,{fontFamily:'system-ui',fontSize:28,color:'#fff'}).setOrigin(0.5);

    const name = (prompt('Masukkan nama untuk leaderboard:', localStorage.getItem('rr_name')||'player') || 'player').slice(0,14);
    localStorage.setItem('rr_name', name);
    const rows = addScore(name, this.final);

    this.add.text(cx,cy+8,'Leaderboard (Local)',{fontFamily:'system-ui',fontSize:22,color:'#a7a7a7'}).setOrigin(0.5);
    const y0 = cy+36;
    rows.slice(0,10).forEach((r,i)=>{
      const y = y0 + i*26;
      const color = (r.name===name && r.score===this.final) ? '#35e1a1' : '#fff';
      this.add.text(cx-150,y,String(i+1).padStart(2,'0'),{fontFamily:'monospace',fontSize:18,color}).setOrigin(0,0.5);
      this.add.text(cx-110,y,r.name,{fontFamily:'system-ui',fontSize:18,color}).setOrigin(0,0.5);
      this.add.text(cx+160,y,String(r.score),{fontFamily:'system-ui',fontSize:18,color}).setOrigin(1,0.5);
    });

    const again=this.add.rectangle(cx-120,HEIGHT-80,220,56,0x35e1a1).setInteractive({useHandCursor:true});
    this.add.text(again.x,again.y,'PLAY AGAIN',{fontFamily:'system-ui',fontSize:20,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    again.on('pointerup',()=>this.scene.start('game'));

    const menu=this.add.rectangle(cx+120,HEIGHT-80,220,56,0xFFC62E).setInteractive({useHandCursor:true});
    this.add.text(menu.x,menu.y,'MAIN MENU',{fontFamily:'system-ui',fontSize:20,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    menu.on('pointerup',()=>this.scene.start('menu'));
  }
}
function addScore(name, score){
  try{
    const rows = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    rows.push({name, score, ts: Date.now()});
    rows.sort((a,b)=>b.score - a.score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0,10)));
    return rows;
  }catch{
    return [{name, score}];
  }
}

/* ----------- Start Phaser ----------- */
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  physics: { default:'arcade', arcade:{ gravity:{y:1200}, debug:false } },
  scene: [Boot, Splash, Menu, Game, Over],
});
/* ================ END ================ */

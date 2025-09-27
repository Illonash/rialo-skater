// ================== CONFIG ==================
const W = 1280, H = 720;
const STORAGE_KEY = 'rialo_skater_leaderboard_v1';

// ================== BOOT ====================
class Boot extends Phaser.Scene{
  constructor(){ super('boot'); }
  preload(){
    // karakter (9 frame @128x128)
    this.load.spritesheet('skater','assets/skater_girl.png?v=7',{frameWidth:128,frameHeight:128});

    // splash + menu preview
    this.load.image('splash','assets/splash_16x9.png?v=7');
    this.load.image('char_preview','assets/char_skater_preview.png?v=7');
    this.load.image('map_city_preview','assets/maps/city/map_city_preview.png?v=7');

    // parallax 6 layer
    for(let i=1;i<=6;i++) this.load.image('city'+i,`assets/maps/city/city${i}.png?v=7`);

    // obstacles (sesuaikan dengan nama file kamu)
    this.load.image('ob_cone','assets/obstacles/cone.png?v=1');
    this.load.image('ob_barier','assets/obstacles/barier.png?v=1');
    this.load.image('ob_barier2','assets/obstacles/barier2.png?v=1');
  }
  create(){ this.scene.start('splash'); }
}

// ================== SPLASH ==================
class Splash extends Phaser.Scene{
  constructor(){ super('splash'); }
  create(){
    const cx=W/2, cy=H/2;
    const tex=this.textures.get('splash')?.getSourceImage();
    if(tex && tex.width){
      const bg=this.add.image(cx,cy,'splash').setOrigin(0.5);
      const s=Math.max(W/tex.width,H/tex.height); bg.setScale(s);
    }else{
      this.cameras.main.setBackgroundColor('#101316');
      this.add.text(cx,cy-60,'Rialo Skater',{fontFamily:'system-ui',fontSize:48,color:'#fff',fontStyle:'bold'}).setOrigin(0.5);
      this.add.text(cx,cy-16,'Rethink • Rebuild • Rialo',{fontFamily:'system-ui',fontSize:20,color:'#b8c0cc'}).setOrigin(0.5);
    }
    const btn=this.add.rectangle(cx,cy+210,240,64,0xFFC62E).setInteractive({useHandCursor:true});
    this.add.text(btn.x,btn.y,'PLAY',{fontFamily:'system-ui',fontSize:26,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    btn.on('pointerup',()=>this.scene.start('menu'));
  }
}

// ================== MENU ====================
class Menu extends Phaser.Scene{
  constructor(){ super('menu'); }
  create(){
    this.cameras.main.setBackgroundColor('#0f1216');
    const F='system-ui';
    const marginX=40, gap=40;
    const colW=(W - marginX*2 - gap)/2;
    const leftX=marginX+colW/2, rightX=W-marginX-colW/2;

    // Map preview (kiri)
    this.add.text(leftX,70,'City',{fontFamily:F,fontSize:24,color:'#fff'}).setOrigin(0.5,1);
    this.add.rectangle(leftX, 330, colW, 280, 0x11161c).setStrokeStyle(2,0x2c3440);
    const mapTex=this.textures.get('map_city_preview').getSourceImage();
    const map=this.add.image(leftX,330,'map_city_preview').setOrigin(0.5);
    map.setScale(Math.min((colW-20)/mapTex.width,(280-20)/mapTex.height));

    // Char preview (kanan)
    this.add.text(rightX,70,'Skater Girl',{fontFamily:F,fontSize:24,color:'#fff'}).setOrigin(0.5,1);
    this.add.rectangle(rightX, 315, colW, 320, 0x11161c).setStrokeStyle(2,0x2c3440);
    const cp=this.textures.get('char_preview').getSourceImage();
    const ch=this.add.image(rightX,315,'char_preview').setOrigin(0.5);
    ch.setScale(Math.min((colW*0.78)/cp.width,(320*0.78)/cp.height));
    this.add.rectangle(rightX,315,colW+4,320+4).setStrokeStyle(4,0x35e1a1);

    // Tombol
    const btn=this.add.rectangle(W/2, H-90, 260, 64, 0x35e1a1).setInteractive({useHandCursor:true});
    this.add.text(btn.x,btn.y,'SKATE!',{fontFamily:F,fontSize:26,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    btn.on('pointerup',()=>this.scene.start('game'));
    this.input.keyboard.on('keydown',e=>{ if(e.code==='Enter'||e.code==='Space') this.scene.start('game') });
  }
}

// =============== GAME ========================
class Game extends Phaser.Scene{
  constructor(){ super('game'); }
  create(){
    // Parallax
    this.layers=[];
    const base=[0.06,0.10,0.20,0.35,0.55,0.80];
    for(let i=1;i<=6;i++){
      const k='city'+i, ts=this.add.tileSprite(0,0,W,H,k).setOrigin(0,0);
      const img=this.textures.get(k).getSourceImage();
      const s=Math.max(W/img.width,H/img.height); ts.setTileScale(s,s);
      this.layers.push({ts,base:base[i-1],speed:base[i-1]});
    }

    // Physics & ground
    this.physics.world.setBounds(0,0,Number.MAX_SAFE_INTEGER/4,H);
    this.groundY=H-90;
    this.add.rectangle(W/2,this.groundY+1,W,2,0x000000,0.25).setScrollFactor(0).setDepth(5); // garis bantu

    // Player
    this.player=this.physics.add.sprite(200,this.groundY-60,'skater',0).setScale(1.2).setDepth(20);
    this.player.setCollideWorldBounds(true);
    this.anims.create({key:'idle',frames:[{key:'skater',frame:0}],frameRate:1,repeat:-1});
    this.anims.create({key:'run',frames:this.anims.generateFrameNumbers('skater',{start:1,end:4}),frameRate:12,repeat:-1});
    this.anims.create({key:'jump',frames:this.anims.generateFrameNumbers('skater',{start:5,end:7}),frameRate:12,repeat:0});
    this.anims.create({key:'crash',frames:[{key:'skater',frame:8}],frameRate:1,repeat:0});
    this.player.play('run');

    // HUD
    this.hp=3; this.inv=false; this.score=0;
    this.baseSpeed=120; this.speed=this.baseSpeed;
    this.scoreTxt=this.add.text(20,18,'Score: 0',{fontFamily:'system-ui',fontSize:24,color:'#fff'}).setScrollFactor(0);
    this.hpTxt=this.add.text(W-20,18,'♥♥♥',{fontFamily:'system-ui',fontSize:28,color:'#ff5a6a'}).setOrigin(1,0).setScrollFactor(0);

    // Groups
    this.obstacles=this.physics.add.group();
    this.gems=this.physics.add.group();

    // Spawner
    this.obTimer=this.time.addEvent({delay:2000, loop:true, callback:()=>this.spawnObstacle()});
    this.gemTimer=this.time.addEvent({delay:1300, loop:true, callback:()=>this.spawnGem()});
    this.time.addEvent({delay:25000, loop:true, callback:()=>this.rampUp()});

    // Collisions
    this.physics.add.collider(this.player,this.obstacles,()=>this.hit());

    // Input
    this.cursors=this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown',()=>this.jump());
  }

  rampUp(){
    this.speed += 12;
    const f=this.speed/this.baseSpeed;
    this.layers.forEach(l=> l.speed=l.base*f);
    const newDelay=Phaser.Math.Clamp(2200 - (this.speed-this.baseSpeed)*2, 1500, 2400);
    this.obTimer.reset({delay:newDelay,loop:true,callback:()=>this.spawnObstacle()});
  }

  jump(){
    if(!this.player.body.onFloor()) return;
    this.player.setVelocityY(-520);
    this.player.play('jump',true);
  }

  update(time,delta){
    const dt=delta/1000;
    this.player.setVelocityX(this.speed);

    this.layers.forEach(l=> l.ts.tilePositionX += l.speed * (dt*60));

    this.score += dt * Math.round(this.speed/8);
    this.scoreTxt.setText('Score: '+Math.floor(this.score));

    if(Phaser.Input.Keyboard.JustDown(this.cursors.space)||Phaser.Input.Keyboard.JustDown(this.cursors.up))
      this.jump();

    this.obstacles.children.iterate(o=>{ if(o && o.x<-120) o.destroy(); });
    this.gems.children.iterate(g=>{ if(g && g.x<-80) g.destroy(); });

    this.physics.overlap(this.player,this.gems,(p,g)=>{ g.destroy(); this.score+=15; });
  }

  // ----- obstacle: pakai sprite; fallback ke rect bila texture tak ada -----
  spawnObstacle(){
    const keys=['ob_cone','ob_barier','ob_barier2'];
    const key=Phaser.Utils.Array.GetRandom(keys);
    const has=this.textures.exists(key);

    const x=W+100, y=this.groundY;
    let ob;

    if(has){
      ob=this.add.image(x,y,key).setOrigin(0.5,1).setDepth(15);
      this.physics.add.existing(ob);
      ob.body.setAllowGravity(false).setImmovable(true);
      // ukuran collider default dari gambar, tak perlu setSize manual
    }else{
      // kalau tex tidak ada → PASTI terlihat
      const t=Phaser.Utils.Array.GetRandom([{w:48,h:60,c:0xD94848},{w:64,h:28,c:0xE3C833}]);
      ob=this.add.rectangle(x,y,t.w,t.h,t.c).setOrigin(0.5,1).setDepth(15);
      this.physics.add.existing(ob);
      ob.body.setAllowGravity(false).setImmovable(true);
    }

    ob.body.setVelocityX(-this.speed);
    this.obstacles.add(ob);
  }

  spawnGem(){
    const y=this.groundY - 120 - Math.random()*120;
    const x=W + 80;
    const c=this.add.circle(x,y,10,0x35e1a1).setDepth(12);
    this.physics.add.existing(c);
    c.body.setVelocityX(-this.speed).setAllowGravity(false);
    this.gems.add(c);
  }

  hit(){
    if(this.inv) return;
    this.hp -= 1;
    this.hpTxt.setText('♥'.repeat(this.hp)).setColor('#ff5a6a');
    this.player.play('crash',true);
    this.player.setTint(0xff6666);
    this.cameras.main.shake(120,0.003);

    if(this.hp<=0){
      this.player.setVelocity(0);
      this.time.delayedCall(600,()=>this.scene.start('over',{score:Math.floor(this.score)}));
      return;
    }
    this.inv=true;
    this.time.delayedCall(280,()=>this.player.play('run',true));
    this.tweens.add({targets:this.player,alpha:0.3,yoyo:true,repeat:6,duration:90});
    this.time.delayedCall(1100,()=>{ this.inv=false; this.player.clearTint(); this.player.alpha=1; });
  }
}

// =============== GAME OVER ===================
class Over extends Phaser.Scene{
  constructor(){ super('over'); }
  init(d){ this.final=d.score||0; }
  create(){
    const cx=W/2, cy=H/2;
    this.cameras.main.setBackgroundColor('#101010');
    this.add.text(cx,cy-120,'Game Over',{fontFamily:'system-ui',fontSize:54,color:'#fff',fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(cx,cy-60,`Score: ${this.final}`,{fontFamily:'system-ui',fontSize:28,color:'#fff'}).setOrigin(0.5);

    const name=(prompt('Masukkan nama untuk leaderboard:',localStorage.getItem('rr_name')||'player')||'player').slice(0,14);
    localStorage.setItem('rr_name',name);
    const rows=addScore(name,this.final);

    this.add.text(cx,cy+8,'Leaderboard (Local)',{fontFamily:'system-ui',fontSize:22,color:'#a7a7a7'}).setOrigin(0.5);
    const y0=cy+36;
    rows.slice(0,10).forEach((r,i)=>{
      const y=y0+i*26, color=(r.name===name && r.score===this.final)?'#35e1a1':'#fff';
      this.add.text(cx-150,y,String(i+1).padStart(2,'0'),{fontFamily:'monospace',fontSize:18,color}).setOrigin(0,0.5);
      this.add.text(cx-110,y,r.name,{fontFamily:'system-ui',fontSize:18,color}).setOrigin(0,0.5);
      this.add.text(cx+160,y,String(r.score),{fontFamily:'system-ui',fontSize:18,color}).setOrigin(1,0.5);
    });

    const again=this.add.rectangle(cx-120,H-80,220,56,0x35e1a1).setInteractive({useHandCursor:true});
    this.add.text(again.x,again.y,'PLAY AGAIN',{fontFamily:'system-ui',fontSize:20,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    again.on('pointerup',()=>this.scene.start('game'));

    const menu=this.add.rectangle(cx+120,H-80,220,56,0xFFC62E).setInteractive({useHandCursor:true});
    this.add.text(menu.x,menu.y,'MAIN MENU',{fontFamily:'system-ui',fontSize:20,color:'#111',fontStyle:'bold'}).setOrigin(0.5);
    menu.on('pointerup',()=>this.scene.start('menu'));
  }
}
function addScore(name,score){
  try{
    const rows=JSON.parse(localStorage.getItem(STORAGE_KEY))||[];
    rows.push({name,score,ts:Date.now()});
    rows.sort((a,b)=>b.score-a.score);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(0,10)));
    return rows;
  }catch{ return [{name,score}] }
}

// =============== PHASER GAME =================
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#000',
  scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  physics:{ default:'arcade', arcade:{ gravity:{y:1200}, debug:false }},
  scene:[Boot,Splash,Menu,Game,Over]
});

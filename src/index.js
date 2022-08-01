const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
let DEFAULT_HEIGHT = 720
let DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT

if (window.innerHeight > window.innerWidth) {
     DEFAULT_WIDTH = 720
     DEFAULT_HEIGHT = ratio * DEFAULT_WIDTH
}

const CENTER_X = DEFAULT_WIDTH / 2;
const CENTER_Y = DEFAULT_HEIGHT / 2;
const MIN = Math.min(DEFAULT_HEIGHT,DEFAULT_WIDTH)

const SADE = MIN/2 - (MIN/2*0.08) - 9.8; //9.8 on maaginen numero
const SOLUN_SADE = SADE * 0.08;
const VALIN_KULMA = ((360.0 / 28.0) * Math.PI) / 180;

function laskePiste(kulma, sade) {
     const xdir = Math.cos(kulma) * sade;
     const ydir = Math.sin(kulma) * sade;
     return [CENTER_X + xdir, CENTER_Y + ydir];
}
function pisteet() {
     const pisteet = [];

     let kulma = VALIN_KULMA
     let index = 1;
     while (kulma <= 2 * Math.PI) {
          const piste = laskePiste(kulma, SADE);
          pisteet.push(piste);
          if (index % 7 == 3) {
               let uusikulma = kulma + VALIN_KULMA / 2;
               let uusisade = SADE - SOLUN_SADE * 2;
               for (let i = 0; i < 4; i++) {
                    const piste = laskePiste(uusikulma, uusisade);
                    uusisade -= SADE / 6;
                    pisteet.push(piste);
               }
               let uusikulma2 = kulma - VALIN_KULMA / 2;
               for (let i = 0; i < 4; i++) {
                    const piste = laskePiste(uusikulma2, SADE + SOLUN_SADE * 2);
                    uusikulma2 += (2 * VALIN_KULMA) / 3;
                    pisteet.push(piste);
               }
          }
          kulma += VALIN_KULMA;
          index++;
     }
     return pisteet;
}
const mode = window.innerHeight > window.innerWidth ? Phaser.Scale.WIDTH_CONTROLS_HEIGHT : Phaser.Scale.HEIGHT_CONTROLS_WIDTH;
console.log(DEFAULT_WIDTH, DEFAULT_HEIGHT)
var config = {
     type: Phaser.AUTO,
     scene: {
         preload: preload,
         create: create,
         update: update
     },
     scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT    
      },
 };
 var game = new Phaser.Game(config);

 function preload() {
     this.load.image('board',"assets/kimble.png")

 }
 function create() {
     this.add.image(CENTER_X, CENTER_Y  , 'board').setDisplaySize(MIN,MIN);
     
     const pisteet_list = pisteet();
     pisteet_list.forEach(p => {
          this.add.circle(p[0],p[1],SOLUN_SADE,"#000000")
     }) 
 }
 function update() {

 }
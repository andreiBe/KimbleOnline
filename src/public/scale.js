const ratio = Math.max(window.innerWidth / window.innerHeight, window.innerHeight / window.innerWidth)
let DEFAULT_HEIGHT = 720.0
let DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT

if (window.innerHeight > window.innerWidth) {
     DEFAULT_WIDTH = 720.0
     DEFAULT_HEIGHT = ratio * DEFAULT_WIDTH
}
const MIN = Math.min(DEFAULT_HEIGHT,DEFAULT_WIDTH)

const CENTER_X = MIN / 2
const CENTER_Y = MIN / 2;


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
               //päämääräsolut
               for (let i = 0; i < 4; i++) {
                    const piste = laskePiste(uusikulma, uusisade);
                    uusisade -= SADE / 6;
                    pisteet.push(piste);
               }
               //kotisolut
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

export {
     pisteet,
     MIN,
     CENTER_X,
     CENTER_Y,
     SOLUN_SADE
}
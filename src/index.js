import Phaser from "phaser";

const config = {
     type: Phaser.AUTO,
     width: window.innerWidth,
     height: window.innerHeight - 5,
     physics: {
          default: "arcade",
          arcade: {
               gravity: { y: 300 },
               debug: false,
          },
     },
};
const game = new Phaser.Game(config);

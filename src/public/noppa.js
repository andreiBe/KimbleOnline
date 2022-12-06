import { MIN, CENTER_X, CENTER_Y, SOLUN_SADE } from "./scale.js";
class Noppa {
     constructor(scene) {
          this.scene = scene
     }
     preload() {
          this.scene.load.spritesheet("dice", "assets/dice.png", {
               frameWidth: 64,
               frameHeight: 64,
          });
          this.scene.load.image("press", "assets/press.png");
     }
     onTurn(player) {
          this.please_press.setAlpha(0)
          if (player.id === this.scene.socket.id) {
               this.please_press.setAlpha(1)
               this.dice.setAlpha(0)
          }
     }
     create() {
          this.createDiceRoller()
          this.dice = this.scene.add.sprite(CENTER_X, CENTER_Y);
          this.please_press = this.scene.add.image(CENTER_X, CENTER_Y - 15, "press");
          this.please_press.setAlpha(0)
          this.dice.setAlpha(0)
          //kertoo mikä nopan heitto vastaa mitäkin sprite sheetin kuvaa
          const frameMapping = { 6: 0, 1: 1, 2: 2, 5: 3, 3: 4, 4: 5 };
          let lastRoll;
          this.scene.socket.on("dice rolled", (result) => {
               this.dice.setAlpha(1)
               this.dice.play("roll");

               lastRoll = result
          });
          this.dice.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
               this.dice.setTexture("dice");
               this.dice.setFrame(frameMapping[lastRoll.result]);
               if (lastRoll.id === this.scene.socket.id) {
                    this.scene.handleDiceRoll(lastRoll);
               }
          });
          this.scene.tweens.add({
			targets: this.please_press,
			x: CENTER_X,
			y: CENTER_Y + 15,
			ease: "Linear",
               yoyo: true,
			duration: 1000,
			loop:-1
		});
          this.scene.anims.create({
			key: "roll",
			frames: this.scene.anims.generateFrameNumbers("dice", {
				start: 0,
				end: 5,
			}),
			duration: 500,
			frameRate: 8,
			repeat: 0.5,
		});
     }
     createDiceRoller() {
          const diceroller = this.scene.add.circle(
               CENTER_X,
               CENTER_Y,
               3 * SOLUN_SADE,
               0xffd800,
               0.1
          );
          diceroller.setInteractive();
          diceroller.on("pointerdown", () => {
               this.please_press.setAlpha(0);
               this.scene.socket.emit("try to dice");
          });
     }
}
export default Noppa
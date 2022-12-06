import { MIN, CENTER_X, CENTER_Y, SOLUN_SADE } from "./scale.js";
import { chat, add_to_chat } from "./chat.js";
import { BaseScene } from "./baseClass.js";
import Noppa from "./noppa.js";

const scroll = document.querySelector("#messages")
window.setInterval(function() {
	scroll.scrollTop = scroll.scrollHeight;
}, 1000);
class MyScene extends BaseScene {
	constructor() {
		super();
		this.noppa = new Noppa(this);
	}
	preload() {
		this.load.image("board", "assets/kimble2.png");
		//this.load.image("green-particle", "assets/green_particle.png");
		this.load.image("skip-button", "assets/skip-button.png");
		this.load.image("skip-button-active", "assets/skip-button-active.png");
		this.load.image("active", "assets/active.png");
		this.load.image("afk", "assets/afk.png");
		this.noppa.preload();
	}
	listenForEvents() {
		this.socket.on("timer", (time) => {
			add_to_chat({
				str:
					time == 0
						? "Game has begun"
						: `Game begins in ${time} seconds`,
				color: "black",
			});
		});
		this.socket.on("playernumber", (number) => {
			document.querySelector("#playernumber").innerHTML = "Number of players: " + number
		})
		this.socket.on("new players", (players) => {
			Object.entries(players).forEach(([color,player]) => {
				const username = player == "bot" ? "bot" : player.id == this.socket.id ? "You" : player.username
				document.querySelector("#"+color+"-lab").innerHTML = 
					"<span style=\"color: "+color+"\"> " + color + "</span>: " + username	
			})
		})
		this.socket.on("turn", (player) => {
			if (player == undefined) return;
			this.removeCircleDecorations();
			this.noppa.onTurn(player);
			this.turnInformers.forEach((informer) => {
				if (informer.name == player.team)
					informer.rec.fillColor = 0x00ff00;
				else informer.rec.fillColor = this.turn_informer_off_color;
			});
		});

		this.socket.on("update locations", (locations) => {
			this.removeCircleDecorations();
			["red", "green", "yellow", "blue"].forEach((team) => {
				locations[team].forEach((loc, i) => {
					this.circles[team][i].loc = loc;
					const p = this.pisteet[loc];
					const circle = this.circles[team][i].circle;

					this.tweens.add({
						targets: circle,
						x: p[0],
						y: p[1],
						ease: "Quad.out",
						duration: 1000,
					});
					//circle.setPosition(p[0],p[1])
				});
			});
		});
		this.socket.on("win", () => {
			new JSConfetti().addConfetti()
		});
		chat(this.socket);
	}
	makeButtonInteractable(button, action, activeTexture, normalTexture) {
		button
			.setInteractive()
			.on("pointerdown", () => {
				action();
				if (activeTexture !== undefined)
					button.setTexture(activeTexture);
			})
			.on("pointerup", () => {
				if (normalTexture !== undefined) {
					button.setTexture(normalTexture);
				}
			})
			.on("pointerover", () => {
				button.setScale(1.1);
			})
			.on("pointerout", () => {
				button.setScale(1);
			});
	}
	create() {
		this.loadingScreen();
		this.listenForEvents();
		//luodaan kaikki ui elementit
		this.createTurnInformers();
		this.add.image(CENTER_X, CENTER_Y, "board").setDisplaySize(MIN, MIN);
		this.noppa.create();
		this.createCircles();

		const skipbutton = this.add.sprite(
			CENTER_X,
			CENTER_Y + 120,
			"skip-button"
		);
		this.makeButtonInteractable(
			skipbutton,
			() => {
				this.socket.emit("skip");
			},
			"skip-button-active",
			"skip-button"
		);

		let active = true;
		const activeOrAfk = this.add.sprite(CENTER_X, CENTER_Y + 200, "active");
		this.status = document.getElementById("status-lab")
		activeOrAfk.allowclick = true;
		this.makeButtonInteractable(activeOrAfk, () => {
			if (! activeOrAfk.allowclick) return;

			active = !active;
			if (active) {
				activeOrAfk.setTexture("active");
				this.socket.emit("become active");
				this.status.innerHTML = "Your status: active"
			} else {
				activeOrAfk.setTexture("afk");
				this.socket.emit("become afk");
				this.status.innerHTML = "Your status: <span style=\"color:red\">afk</span>"
			}
			activeOrAfk.allowclick = false;
			activeOrAfk.setTint(0xff00ff, 0xffff00, 0x00f0ff, 0xff00ff);
			setTimeout(()=> {
				activeOrAfk.clearTint()
				activeOrAfk.allowclick = true;
			}, 1000)
		});
		this.socket.on('ban', (id) => {
			if (id == this.socket.id) {
				active = false;
				activeOrAfk.setTexture("afk")
				this.status.innerHTML = "Your status: <span style=\"color:red\">afk</span>"
			}
		})
	}
	loadingScreen() {
		const startButton = document.getElementById("start");
		const field = document.getElementById("username-field");

		setTimeout(() => {
			startButton.removeAttribute("disabled");
			document.getElementById("loading-status").innerHTML =
				"Ready to play!";

			startButton.onclick = () => {
				document
					.getElementById("loadingScreen")
					.removeAttribute("style");
				this.socket.emit("username", {username: field.value})
			};
		}, 2000);
	}
}
var config = {
	type: Phaser.AUTO,
	parent: "content",
	backgroundColor: 0xffffff,
	scene: MyScene,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: MIN,
		height: MIN,
	},
};
var game = new Phaser.Game(config);

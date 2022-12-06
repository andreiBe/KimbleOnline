import { pisteet, MIN, CENTER_X, CENTER_Y, SOLUN_SADE } from "./scale.js";
const TEAMS = [
	{ name: "red", locations: [7, 8, 9, 10], color: 0xff0000 },
	{ name: "blue", locations: [22, 23, 24, 25], color: 0x0026ff },
	{ name: "yellow", locations: [37, 38, 39, 40], color: 0xffd800 },
	{ name: "green", locations: [52, 53, 54, 55], color: 0x007f0e },
];

class BaseScene extends Phaser.Scene {
	constructor() {
		super({ key: "BaseScene" });
		this.socket = io();
		this.pisteet = pisteet();
	}
	createTurnInformers() {
		this.turn_informer_off_color = 0x54460000
		this.turnInformers = [
			{
				name: "red",
				rec: this.add.rectangle(
					CENTER_X * 1.5,
					CENTER_Y * 1.5,
					CENTER_X,
					CENTER_Y,
					this.turn_informer_off_color
				),
			},
			{
				name: "blue",
				rec: this.add.rectangle(
					CENTER_X * 0.5,
					CENTER_Y * 1.5,
					CENTER_X,
					CENTER_Y,
					this.turn_informer_off_color
				),
			},
			{
				name: "yellow",
				rec: this.add.rectangle(
					CENTER_X * 0.5,
					CENTER_Y * 0.5,
					CENTER_X,
					CENTER_Y,
					this.turn_informer_off_color
				),
			},
			{
				name: "green",
				rec: this.add.rectangle(
					CENTER_X * 1.5,
					CENTER_Y * 0.5,
					CENTER_X,
					CENTER_Y,
					this.turn_informer_off_color
				),
			},
		];
	}
	createCircles() {
		this.circles = { red: [], blue: [], yellow: [], green: [] };
		TEAMS.forEach((team) => {
			team.locations.forEach((loc, i) => {
				const p = this.pisteet[loc];
				const circle = this.add.circle(
					p[0],
					p[1],
					SOLUN_SADE,
					team.color
				);
				const circleObj = { circle, loc, next: undefined };
				this.makeCircleInteractable(circle, circleObj, team, i);
				this.circles[team.name].push(circleObj);
			});
		});
	}
	makeCircleInteractable(circle, circleObj, team, i) {
		circle.setInteractive();
		circle.on("pointerdown", () => {
			this.socket.emit("try to move", {
				team: team.name,
				loc: this.circles[team.name][i].loc,
			});
		});
		circle.on("pointerover", () => {
			if (circleObj.next != undefined) {
				const p = this.pisteet[circleObj.next];
				const markerCircle = this.add.circle(
					p[0],
					p[1],
					SOLUN_SADE,
					0xff66d8
				);
				circleObj.marker = markerCircle;
			}
		});
		circle.on("pointerout", () => {
			if (circleObj.marker != undefined) {
				circleObj.marker.destroy();
			}
		});
		//todo pointer on top of
	}
	removeCircleDecorations() {
		for (const team of ["red", "blue", "yellow", "green"]) {
			this.circles[team].forEach((circle) => {
				circle.circle.setStrokeStyle(1, 0x000);
				circle.next = undefined;
			});
		}
	}
	handleDiceRoll(result) {
		if (result.possibleMoves.length == 0) {
			setTimeout(() => this.socket.emit("skip"), 1500);
			return;
		}
		result.possibleMoves.forEach((move) => {
			this.circles[result.team].forEach((circle) => {
				if (circle.loc === move.from) {
					circle.next = move.to;
					circle.circle.setStrokeStyle(4, 0xefc53f);
				}
			});
		});
	}
}
export { BaseScene };

(() => {
	"use strict";
	const e = Math.max(
		window.innerWidth / window.innerHeight,
		window.innerHeight / window.innerWidth
	);
	let t = 720,
		o = e * t;
	window.innerHeight > window.innerWidth && ((o = 720), (t = e * o));
	const s = Math.min(t, o),
		i = s / 2,
		n = s / 2,
		c = s / 2 - (s / 2) * 0.08 - 9.8,
		r = 0.08 * c,
		a = ((360 / 28) * Math.PI) / 180;
	function l(e, t) {
		const o = Math.cos(e) * t,
			s = Math.sin(e) * t;
		return [i + o, n + s];
	}
	const d = document.querySelector(".messages"),
		h = document.querySelector("#message-field");
	function p(e) {
		const t = document.createElement("div");
		t.appendChild(document.createTextNode(e)), d.appendChild(t);
	}
	var m = {
		type: Phaser.AUTO,
		parent: "content",
		scene: {
			preload: function () {
				this.load.image("board", "assets/kimble.png"),
					this.load.image(
						"green-particle",
						"assets/green_particle.png"
					),
					this.load.image("skip-button", "assets/skip-button.png");
			},
			create: function () {
				(this.socket = io()),
					this.add.image(i, n, "board").setDisplaySize(s, s);
				const e = this.add.circle(i, n, 3 * r, 16766976, 0.1);
				e.setInteractive(),
					e.on("pointerdown", () => {
						this.socket.emit("try to dice");
					});
				const t = this.add
					.text(i, n, "", { font: "bold 32px Arial", fill: "#000" })
					.setOrigin(0.5);
				(this.pisteet = (function () {
					const e = [];
					let t = a,
						o = 1;
					for (; t <= 2 * Math.PI; ) {
						const s = l(t, c);
						if ((e.push(s), o % 7 == 3)) {
							let o = t + a / 2,
								s = c - 2 * r;
							for (let t = 0; t < 4; t++) {
								const t = l(o, s);
								(s -= c / 6), e.push(t);
							}
							let i = t - a / 2;
							for (let t = 0; t < 4; t++) {
								const t = l(i, c + 2 * r);
								(i += (2 * a) / 3), e.push(t);
							}
						}
						(t += a), o++;
					}
					return e;
				})()),
					(this.circles = (function (e) {
						const t = e.add.group(),
							o = {};
						return (
							[
								{
									name: "red",
									locations: [7, 8, 9, 10],
									color: 16711680,
								},
								{
									name: "green",
									locations: [52, 53, 54, 55],
									color: 32526,
								},
								{
									name: "yellow",
									locations: [37, 38, 39, 40],
									color: 16766976,
								},
								{
									name: "blue",
									locations: [22, 23, 24, 25],
									color: 9983,
								},
							].forEach((s) => {
								(o[s.name] = []),
									s.locations.forEach((i, n) => {
										const c = e.pisteet[i],
											a = e.add.circle(
												c[0],
												c[1],
												r,
												s.color
											);
										a.setInteractive(),
											a.on("pointerdown", (t) => {
												e.socket.emit("try to move", {
													team: s.name,
													loc: o[s.name][n].loc,
												});
											}),
											t.add(a),
											o[s.name].push({
												circle: a,
												loc: i,
											});
									});
							}),
							o
						);
					})(this)),
					this.socket.on("update locations", (e) => {
						["red", "green", "yellow", "blue"].forEach((t) => {
							e[t].forEach((e, o) => {
								this.circles[t][o].loc = e;
								const s = this.pisteet[e];
								this.circles[t][o].circle.setPosition(
									s[0],
									s[1]
								);
							});
						});
					});
				var o = this.add.particles("green-particle");
				const m = new Phaser.Geom.Circle(0, 0, 3 * r);
				var u,
					g = o.createEmitter({
						x: i,
						y: n,
						blendMode: "ADD",
						scale: { start: 1, end: 0 },
						speed: 20,
						emitZone: {
							type: "edge",
							source: m,
							quantity: 12,
							yoyo: !1,
						},
					});
				g.stop(),
					this.socket.on("turn", (e) => {
						for (const e of ["red", "blue", "yellow", "green"])
							this.circles[e].forEach((e) => {
								e.circle.setStrokeStyle(1, 0);
							});
						e.id === this.socket.id && g.start();
					}),
					this.socket.on("dice rolled", (e) => {
						if (
							((t.text = `${e.result}`), e.id === this.socket.id)
						) {
							if ((g.stop(), 0 == e.possibleMoves.length))
								return void this.socket.emit("skip");
							e.possibleMoves.forEach((t) => {
								this.circles[e.team].forEach((e) => {
									e.loc === t &&
										e.circle.setStrokeStyle(4, 15713599);
								});
							});
						}
					}),
					this.socket.on("timer", (e) => {
						p(
							0 == e
								? "Game has begun!"
								: `Game begins in ${e} seconds`
						);
					}),
					(u = this.socket),
					h.addEventListener("keydown", (e) => {
						h.value.startsWith("%") && (d.innerHTML = ""),
							"Enter" == e.key &&
								(u.emit("message", h.value), (h.value = ""));
					}),
					u.on("new message", (e) => {
						p(e);
					}),
					this.add
						.sprite(s - 50, s - 20, "skip-button")
						.setInteractive()
						.on("pointerdown", () => {
							this.socket.emit("skip"), g.stop();
						});
			},
			update: function () {},
		},
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH,
			width: s,
			height: s,
		},
	};
	new Phaser.Game(m);
})();

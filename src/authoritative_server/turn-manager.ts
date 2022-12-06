import { Server, Socket } from "socket.io";
import {
	addPlayerToLocationManager,
	getPossibleMoves,
	moveFigure,
	resetLocations,
	teamHasWon,
} from "./location-manager";
import {
	addPlayerToPlayerManager,
	nextPlayer,
	initPlayers,
     forceAfk
} from "./player-manager";
import { Player, team } from "./interfaces";
//Hoitaa itse pelaamisen, eli käyttäjän syötteiden käsittelyn
//ja esimerkiksi botin pelaamisen

let currentPlayer: Player;
let lastRolled: number = 0;
let gameHasStarted: boolean;
let hasMoved = false; //käyttäjä on jo tehnyt siirtonsa
let turnNumber = 0;
let gameNumber = 0;

let INTERVAL:NodeJS.Timer
//funktio, jota kutsutaan, kun joku on voittanut pelin
let newGameStarterFunc: (io: Server, cooldown: number) => void;
function startGame(
	io: Server,
	startFunc: (io: Server, cooldown: number) => void
) {
	gameHasStarted = true;
	turnNumber = 0;
	gameNumber++;
	newGameStarterFunc = startFunc;
	initPlayers(io); //PlayerManager
	resetLocations(io); //LocationManager
	nextRound(io);

	//Tunnistaa pelaajat, jotka eivät tee siirtoa kahden minuutin sisällä ja heittää
	//heidät ulos pelistä
	let prevTurnNumber = 0;
	let prevGameNumber = 0;
     if (INTERVAL != undefined) clearInterval(INTERVAL)
	INTERVAL = setInterval(() => {
		//sama peli ja sama vuoro numero kuin viime kerralla (muutosta ei ole tapahtunut)
		if (turnNumber == prevTurnNumber && prevGameNumber == gameNumber) {
               forceAfk(currentPlayer.id,io)
			io.emit("ban", currentPlayer.id)
               nextRound(io)
		}
		prevTurnNumber = turnNumber;
		prevGameNumber = gameNumber;
	}, 1000 * 60 * 2); //2min
}

//valitaan uusi pelaaja PlayerManageria käyttäen.
//nextRound ja turn ovat siksi erikseen, koska sama pelaaja voi pelata
//uudestaan, jos heittää nopalla kutosen
function nextRound(io: Server) {
	currentPlayer = nextPlayer();
	turn(io);
}
function turn(io: Server) {
	lastRolled = 0;
	hasMoved = false;
     turnNumber++
	io.emit("turn", currentPlayer);
	if (currentPlayer.id === "bot") {
		//Simppeli algoritmi, jolla botti pelaa
		//myöhemmin koodaan mahdollisesti paremman algoritmin
		throwDice(io);
		const moves = getPossibleMoves(currentPlayer.team, lastRolled);
		if (moves.length == 0) skip(io, false);
		else {
			//valitsee aina ensimmäisen mahdollisen siirron
			setTimeout(() => {
				move(currentPlayer.team, moves[0].from, io);
			}, 2500);
		}
	}
}
function throwDice(io: Server) {
	lastRolled = Math.floor(Math.random() * 6) + 1;
	//lasketaan mahdolliset siirrot vain oikeille pelaajille, koska botti laskee omat siirtonsa
	//myöhemmin
	const possibleMoves =
		currentPlayer.id === "bot"
			? undefined
			: getPossibleMoves(currentPlayer.team, lastRolled);

	io.emit("dice rolled", {
		result: lastRolled,
		id: currentPlayer.id,
		team: currentPlayer.team,
		possibleMoves: possibleMoves,
	});
}
function tryToThrowDice(socket: Socket, io: Server) {
	//tarkistetaan saako pelaaja heittää noppaa
	if (!gameHasStarted || socket.id !== currentPlayer.id || lastRolled !== 0)
		return;
	throwDice(io);
}
function skip(io: Server, isplayer: boolean) {
	hasMoved = true; //asetetaan heti, ettei käyttäjä voi tehdä siirtoja viiveen aikana
	setTimeout(() => {
		if (lastRolled == 6) {
			turn(io); //sama pelaaja
		} else {
			nextRound(io); //uusi pelaaja
		}
	}, isplayer ? 0 : 2500);
}
function try_to_skip(socket: Socket, io: Server) {
	//tarkistetaan saako pelaaja skipata nyt
	if (!gameHasStarted || socket.id !== currentPlayer.id || hasMoved) return;
	skip(io, true);
}
function win(team: team, io: Server): void {
	io.emit("win", team);
	gameHasStarted = false;
	//kutsutaan funktiota, jonka match-manager antoi pelin alkaessa
	newGameStarterFunc(io, 11); //uusi peli alkaa 11.sta sekunnin päästä
}
function move(team: team, loc: number, io: Server) {
	hasMoved = true;
	moveFigure(team, loc, lastRolled, io);

	setTimeout(() => {
		if (teamHasWon(team)) {
			return win(team, io);
		}
		if (lastRolled == 6) {
			turn(io); //sama pelaaja
		} else {
			nextRound(io); //uusi pelaaja
		}
	}, 3000);
}
function tryToMove(socket: Socket, io: Server, moveO: any) {
	//tarkistetaan saako pelaaja tehdä siirtonsa nyt
	if (!gameHasStarted || socket.id !== currentPlayer.id || hasMoved) return;
	if (moveO.team !== currentPlayer.team) return;
	move(moveO.team, moveO.loc, io);
}
function addPlayerToTurnManager(socket: Socket, io: Server, username: any) {
	addPlayerToPlayerManager(socket, io, username);
	addPlayerToLocationManager(socket, io);

	socket.on("try to dice", () => tryToThrowDice(socket, io));
	socket.on("skip", () => try_to_skip(socket, io));
	socket.on("try to move", (move) => tryToMove(socket, io, move));
	socket.on("become afk", () => {
		if (socket.id === currentPlayer.id) nextRound(io)
	})
	socket.on("disconnect", ()=> {
		if (socket.id === currentPlayer.id) nextRound(io)
	})
	setTimeout(()=> {
		socket.emit("turn", currentPlayer)
	}, 2000)
}
export { addPlayerToTurnManager, startGame };

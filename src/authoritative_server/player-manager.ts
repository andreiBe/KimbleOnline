import { Server, Socket } from "socket.io";
import {Player,team} from "./interfaces"
let playerId = 1;
interface usernames {
	[key: string]: string;
}
const usernames: usernames = {};
let num: number = 0;

let round = 0;
let players_playing: Player[] = [];
let players: string[] = [];
let afk: string[] = []
function removePlayer(socket: Socket, io: Server) {
	num--;
	delete usernames[socket.id];
	removeFromPlayers(socket.id,io)
}
function forceAfk(id:string,io:Server) {
	io.emit("new message", {
		str: usernames[id] +" is afk",
		color: "red"
	})
	afk.push(id)
	removeFromPlayers(id,io)
}
function becomeActive(socket:Socket, io:Server) {
	io.emit("new message", {
		str: usernames[socket.id] + " is no longer afk",
		color: "green"
	})
	afk.filter(id => id !== socket.id)
	players.push(socket.id)
	fillPlayersPlaying(io)
}
function removeFromPlayers(id:string, io:Server) {
	players = players.filter((id2) => id2 !== id);
	players_playing = players_playing.filter((p) => p.id !== id);
	fillPlayersPlaying(io)
}
function fillPlayersPlaying(io:Server) {
	if (players_playing.length < 4 && players.length > players_playing.length) {
		players.forEach(id => {
			if (! players_playing.some(p => p.id == id)) {
				players_playing.push(createPlayer(id, getTeam(players_playing.length), usernames[id]))
			}
			if (players_playing.length == 4) return;
		})
	}
	io.emit("new players", {
		"red": players_playing.filter(p => p.team === "red")[0] || "bot",
		"blue": players_playing.filter(p => p.team === "blue")[0] || "bot",
		"yellow": players_playing.filter(p => p.team === "yellow")[0] || "bot",
		"green": players_playing.filter(p => p.team === "green")[0] || "bot"
	})
}
const createPlayer = (id: string, team: team, username: string): Player => {
	return { id, team, username};
};
function initPlayers(io:Server) {
     round = 0;
	players = players.sort(() => 0.5 - Math.random());
	players_playing = []
	fillPlayersPlaying(io)
}
function addPlayerToPlayerManager(socket: Socket, io: Server, username: any): void {
	num++;
	usernames[socket.id] = username.username;
	players.push(socket.id);
	fillPlayersPlaying(io)

	console.log("New player joined");
	io.emit("new message", {
		str: getUserNameOf(socket) + " joined",
		color: "green"
	});
	socket.on("message", function (message) {
		io.emit("new message", {
			str: getUserNameOf(socket) + ": " + message.str,
			color: "black"
		})
	});
	socket.on("disconnect", () => {
		console.log("User left");
		io.emit("new message", {
			str: getUserNameOf(socket) + " left",
			color: "red"
		});
		removePlayer(socket, io);
	});
	socket.on("become afk", () => {
		forceAfk(socket.id,io)
	})
	socket.on("become active", () => {
		becomeActive(socket,io)
	})
}
function numberOfPlayers(): number {
	return num;
}

function getUserNameOf(socket: Socket) {
	return usernames[socket.id];
}
interface teamToRound {
	[key:number]:team
}
function getTeam(i: number): team {

	const map: teamToRound = {0: "red", 1: "blue", 2: "yellow", 3: "green"}
	while (true) {
		if (players_playing.some(p => p.team == map[i])) i++;
		else break;
		if (i == 4) i = 0;
	}
	return map[i] || "undefined";
}

function nextPlayer(): Player {
	const colors =  ["red", "blue", "yellow", "green"]
	if (round >= 4) round = 0;
	const color = colors[round]
	const player = players_playing.filter(p => p.team == color)[0]
	if (! player) {
		return createPlayer("bot", getTeam(round++), "bot");
	}
	round++;
	return player;
}
export { addPlayerToPlayerManager, numberOfPlayers, getUserNameOf, nextPlayer,initPlayers,forceAfk };

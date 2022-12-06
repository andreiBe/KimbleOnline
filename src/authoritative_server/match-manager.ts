import { Server, Socket } from "socket.io";
import { startGame,addPlayerToTurnManager} from "./turn-manager";
//Tiedoston tarkoitus on toimia pelin aloittajana.
//Peliä ennen täytyy olla odotus aika, jotta mahdollisimman moni ehtisi mukaan peliin


//kuinka kauan kestää että peli alkaa, kun ensimmäinen käyttäjä liittyy
const GAME_START_COOLDOWN:number= 11
let timeUntilGameStart:number = 0
//pelaajien määrä
let num = 0;
function newGame(io:Server) {
     //huom annetaan parametriksi pelin aloitus funktio, jotta turnManager voi kutsua sitä
     //aloittaakseen uuden pelin, kun joku on voittanut
     startGame(io, startGameAfterCooldown)
}
function startGameAfterCooldown(io:Server, cooldown:number):void {
     timeUntilGameStart = cooldown
     //päivitetään arvo joka sekuntti
     const interval = setInterval(() => {
          timeUntilGameStart--
          //tiedotetaan jäljellä oleva aika
          if (timeUntilGameStart == 30) io.emit("timer", timeUntilGameStart)
          if (timeUntilGameStart == 10) io.emit("timer",timeUntilGameStart)
          if (timeUntilGameStart != 0) return;
          io.emit("timer",timeUntilGameStart)
          newGame(io)
          clearInterval(interval)
     },1000)
}
function startGameIfPlayerIsFirstToJoin(io:Server):void {
     if (num != 1 || timeUntilGameStart != 0) return;

     startGameAfterCooldown(io,GAME_START_COOLDOWN)
}
function addPlayerToMatchManager(socket:Socket, io:Server, username: any) {
     num++
     io.emit("playernumber", num)
     addPlayerToTurnManager(socket,io, username)
     socket.on("disconnect", ()=> {
          num--
          io.emit("playernumber", num)
     })
     startGameIfPlayerIsFirstToJoin(io)
     socket.emit('timer',timeUntilGameStart)
}
export {
     addPlayerToMatchManager
}
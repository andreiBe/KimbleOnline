import { Server, Socket } from "socket.io";
import { locations,coordinate,team,possibleMove } from "./interfaces";
//sanasto

//solu = reikä, joita pitkin napit kulkevat
//tiimi = kukin väri (punainen,sininen,keltainen,vihreä)
/*
koordinaatti = arvopari: tiimi:indeksi, joka kertoo
     mistä tiimistä ja mistä kohtaa tiimin nappulalistaa nappula löytyy
*/
//kotipesä = neljä solua, josta nappulat lähtevät liikkeelle
//maali = neljä solua, jonne nappuloiden kuuluu mennä

//Solujen numerointi:
//Katso dokumentaatiosta kuva

//sijainnit, joista napit lähtevät liikkeelle (kotipesä).
//Käytetään kun halutaan palauttaa tilanne alkutilanteeseen
//tai kun halutaan tarkistaa onko jokin nappula alkusolussa
const original_locations:locations = {
     "red": [7,8,9,10],
     "blue": [22,23,24,25],
     "yellow": [37,38,39,40],
     "green": [52,53,54,55],
     "undefined":[]
}
//sijainnit johon nappuloiden kuuluu päätyä (maali)
//Käytetään, kun pitää tarkistaa onko jokin nappula maalissa
const goal_locations:locations = {
     "red": [3,4,5,6],
     "blue": [18,19,20,21],
     "yellow": [33,34,35,36],
     "green": [48,49,50,51],
     "undefined":[]
}
//kopio objektista, jotta voidaan tehdä syvä kopio
const original_locations_as_string = JSON.stringify(original_locations)
//solut, joista seuraava solu on kyseisen tiimin maali
//Käytetään siihen, että nappula saadaan ohjattua joko omaan maaliin
//tai toisen tiimin maalin ohi
const enters = {
     red: 2,blue:17,yellow:32,green:47,undefined:-1
}

const NOT_POSSIBLE = -1;

let locations:locations = JSON.parse(original_locations_as_string);
function resetLocations(io:Server) {
     //syvä kopio, joka palauttaa napit alku tilanteeseen
     locations = JSON.parse(original_locations_as_string)
     io.emit("update locations", locations)
}
//palauttaa koordinaatin nappulaan, joka löytyy määritetystä solusta
//tai määrittelemättömän tiimin, jos solussa ei ole nappulaa
//tällä funktiolla voi esimerkiksi selvittää onko solussa samaan tiimiin kuuluva nappula
//jolloin soluun ei voi siirtyä
function figureInCell(loc:number):coordinate {
     const teams:team[] = ["red","blue","yellow","green"] 
     for (const team of teams) {
          const i = locations[team].indexOf(loc)
          if (i != -1) return {team,i}
     }
     return {team:"undefined",i:-1}
}
//palauttaa nappulan vapaaseen soluun kotipesään
function returnBackToHome(loc:coordinate) {
     original_locations[loc.team].forEach(homeCell => {
          let empty = true
          locations[loc.team].forEach(loc => {
               if (loc === homeCell) empty = false
          })
          //soluun voi siirtyä
          if (empty) {
               //tässä näkee koordinaatin käytön hyvin
               const oldLocation = locations[loc.team][loc.i]
               changeFigurePosition(loc.team,oldLocation,homeCell)
               return;
          }
     })
}
function changeFigurePosition(team:team, oldLocation:number, newLocation:number) {
     const index = locations[team].indexOf(oldLocation);
     locations[team][index] = newLocation;
}

function moveFigure(team:team,loc:number,diceRoll:number, io:Server) {
     const newLocation = positionOfFigureAfterXMoves(team,loc,diceRoll)
     if (newLocation == NOT_POSSIBLE) return;
     //nappula, joka on paikassa johon halutaan siirtyä
     //Ei voi olla omaan tiimiin kuuluva, koska se tarkistetaan jo aiemmin
     const alreadyThere = figureInCell(newLocation)

     //syödään paikalla oleva nappula
     if (alreadyThere.team != null) {
          returnBackToHome(alreadyThere)
     }
     changeFigurePosition(team,loc,newLocation)
     io.emit("update locations",locations)
}
//tarkistaa ovatko kaikki tiimin nappulat maalissa
function teamHasWon(team:team):boolean {
     return locations[team].every(loc => goal_locations[team].includes(loc))
}
//kertoo nappulan sijainnin x-siirron jälkeen tai palauttaa -1, jos siirto ei ole mahdollinen
function positionOfFigureAfterXMoves(team:team,currentLoc:number,diceRoll:number) {
     //jos nappula on  maalissa, se voi liikkua vain eteenpäin maalin sisällä
     if (goal_locations[team].includes(currentLoc)) {
          const i = goal_locations[team].indexOf(currentLoc)
          if (diceRoll > 3-i) return NOT_POSSIBLE //nappula menisi yli maalin
          const cell = goal_locations[team][i+diceRoll]
          //oman tiimin nappi jo paikalla
          if (figureInCell(cell).team === team) return NOT_POSSIBLE
          return cell
     }
     //jos nappula on kotipesässä, se voi päästä sieltä pois vain heittämällä kutosen
     if (original_locations[team].includes(currentLoc)) {
          if (diceRoll == 6) {
               //katso solujen numerointi dokumentaatiosta
               const exitCell = original_locations[team][3]+1;
               if (figureInCell(exitCell).team === team) return NOT_POSSIBLE
               return exitCell;
          } else {
               return NOT_POSSIBLE;
          }
     }
     //siirrytään eteenpäin yksi kerrallaan
     while (diceRoll--) {
          currentLoc++
          //mennään ympäri
          if (currentLoc == 60) currentLoc = 0;
          //saavutaan soluun, josta voi siirtyä maaliin
          if (currentLoc == 18 || currentLoc == 33 || currentLoc == 48 || currentLoc == 3) {
               //oma maali
               if (enters[team] === currentLoc-1) {
                    const finalPosition = currentLoc + diceRoll;
                    if (diceRoll > 3 || figureInCell(finalPosition).team === team) return NOT_POSSIBLE;
                    return finalPosition;
               } else {
                    //ohitetaan toisen tiimin maali ja kotipesä
                    currentLoc += 8
               }
          }
     }
     if (figureInCell(currentLoc).team === team) return NOT_POSSIBLE;
     return currentLoc;
}
//palauttaa listan siirroista mitä tiimi voi tehdä nopan heitollaan
function getPossibleMoves(team:team,diceRoll:number):possibleMove[] {
     const list:possibleMove[] = []
     locations[team].forEach(loc => {
          const finalPos = positionOfFigureAfterXMoves(team,loc,diceRoll)
          if (finalPos != NOT_POSSIBLE) { //siirron voi tehdä
               list.push({
                    from: loc,
                    to: finalPos
               })
          }
     })
     return list;
}

function addPlayerToLocationManager(socket:Socket, io:Server) {
     //socket.emit('update locations', locations)

     setTimeout(()=> {
		socket.emit("update locations", locations)
	}, 2000)
}

export {
     addPlayerToLocationManager,
     getPossibleMoves,
     moveFigure,
     teamHasWon,
     resetLocations
}
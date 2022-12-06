type team = "red"|"blue"|"yellow"|"green"|"undefined"
interface Player {
     team: team,
     id: string,
     username: string
}
type locations = {
     [key in team]: number[]
}
interface coordinate {
     team: team
     i:number
}
interface possibleMove {
     from: number,
     to: number
}
export {Player, team,locations,coordinate,possibleMove}

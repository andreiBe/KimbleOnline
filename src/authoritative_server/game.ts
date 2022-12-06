import { Server, Socket } from "socket.io";
import { addPlayerToMatchManager } from "./match-manager";

function run(io:Server) {
     io.on('connection', function(socket:Socket) {
          socket.on("username", function(username)  {
               addPlayerToMatchManager(socket,io, username)
          })
     })
}
export {run}
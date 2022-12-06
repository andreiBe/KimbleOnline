import express from "express"
import socket, { Server } from "socket.io"
import * as http from "http"
const app = express();
const server = http.createServer(app)

const io = new Server(server)

app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 8080;
server.listen(PORT, function () {
  console.log(`Listening on ${PORT}`);
});

import {run} from "./authoritative_server/game"
run(io)
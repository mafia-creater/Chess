const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const chess = new Chess();
let players = {
    white: null,
    black: null
};
let currentPlayer = "w"; // Assuming white starts first

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function(socket) {
    console.log("A user connected");

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", () => {
        if (socket.id === players.white) {
            delete players.white;
            console.log("White player disconnected");
        } else if (socket.id === players.black) {
            delete players.black;
            console.log("Black player disconnected");
        }
    });

    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move : ", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error(err);
            console.log("Invalid move : ", move);
            socket.emit("invalidMove", move);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

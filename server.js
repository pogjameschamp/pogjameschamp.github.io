const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const Chess = require('chess.js').Chess;
let players = [];
let currentFen = 'start';

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('User connected');

    // Find available color
    let availableColor = null;
    if (players.length === 0) {
        availableColor = 'white';
    } else if (players.length === 1) {
        availableColor = players[0].color === 'white' ? 'black' : 'white';
    }

    // Assign color to player if available
    if (availableColor) {
        players.push({ socketId: socket.id, color: availableColor });
        socket.emit('assignColor', availableColor); // Send color to the client
        socket.emit('assignRole', 'player');
    } else {
        // Handle case where there are already two players
        socket.emit('assignRole', 'spectator');
    }

    socket.on('playAgain', () => {
        io.emit('reset'); // This sends a reset command to all connected clients
    });

    socket.on('move', (fen) => {
        const player = players.find(p => p.socketId === socket.id);
        if (player && (player.color === 'white' || player.color === 'black')) {
            currentFen = fen;
            socket.broadcast.emit('move', fen);
        } else {
            
        }
    });

    socket.on('disconnect', () => {
        // Remove disconnected player from the players array
        players = players.filter(player => player.socketId !== socket.id);
        console.log('User disconnected');
    });
});


server.listen(3000, () => {
    console.log('Server listening on port 3000');
});

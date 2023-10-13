


document.addEventListener('DOMContentLoaded', () => {
    
    let board = null;
    const game = new Chess();
    const moveHistory = document.getElementById('move-history');
    let moveCount = 1;
    let userColor = 'w'
    let randomMoveTimeout = null;
    let playerColor = null;
    let playerRole = null;

    const recordMove = (move, count) => {
        const formattedMove = count % 2 === 1 ? `${Math.ceil(count / 2)}. ${move}` : `${move} -`;
        moveHistory.textContent += formattedMove + ' ';
        moveHistory.scrollTop = moveHistory.scrollHeight;
    };

    const onDragStart = (source, piece) => {
        console.log("Player role:", playerRole);
        // console.log("Trying to drag:", piece);
        console.log("Current user color:", userColor);
        if (!playerRole || playerRole === 'spectator') {
            return false;
        } 
        return !game.game_over() && piece.search(userColor) === 0;
    }
    

    const onDrop = (source, target) => {
        console.log("Source:", source);
        console.log("Target:", target);
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });
        console.log("Possible moves from g7:", game.moves({ square: 'g7' }));
        console.log(move);

        if (move === null) return 'snapback'


        recordMove(move.san, moveCount);
        moveCount++;
        // This goes in your onDrop function after a successful move
        const fen = game.fen();
        socket.emit('move', fen);
        // After sending the move...
        // socket.emit('requestRandomMove');

        
    }

    const onSnapEnd = () => {
        board.position(game.fen())
    }
    
    function makeRandomMove () {
        var possibleMoves = game.moves()
      
        // exit if the game is over
        if (game.game_over()) {
            clearTimeout(randomMoveTimeout)
            return;
        } 
      
        var randomIdx = Math.floor(Math.random() * possibleMoves.length)
        game.move(possibleMoves[randomIdx])
        board.position(game.fen())
      
        randomMoveTimeout = window.setTimeout(makeRandomMove, 500)
      }

    const boardConfig = {
        showNotation: true,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop,
        onSnapEnd,
        moveSpeed: 'fast',
        snapBackSpeed: 500,
        snapSpeed: 100,
    };

    board = ChessBoard('board', boardConfig);  

    function resetGame() {
        clearTimeout(randomMoveTimeout);
        game.reset();
        board.start();
        moveHistory.textContent = '';
        moveCount = 1;
        userColor = 'w';
    }
    

    document.querySelector('.play-again').addEventListener('click', () => {
        resetGame();
        socket.emit('playAgain');
    });

    document.querySelector('.flip-board').addEventListener('click', () => {
        board.flip();
        // makeRandomMove();
        userColor = userColor === 'w' ? 'b' : 'w';
    })

    document.querySelector('.set-random').addEventListener('click', () => {
        game.reset();
        moveHistory.textContent = '';
        randomMoveTimeout = window.setTimeout(makeRandomMove, 500)

    })



    const socket = io();
   
    socket.on('move', (fen) => {
        game.load(fen);
        board.position(fen);
        const lastMove = game.history().slice(-1)[0];
        recordMove(lastMove, moveCount);
        moveCount++;
    });

    socket.on('reset', () => {
        resetGame();
    });

    socket.on('assignColor', (color) => {
        playerColor = color;
        userColor = color.charAt(0); // 'w' for white and 'b' for black
        console.log(userColor);
    });
    
    socket.on('assignRole', (role) => {
        playerRole = role;
        console.log(playerRole);
    });
    

    socket.on('connect', () => {
        console.log('Connected to the server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from the server');
    });
    
    
})
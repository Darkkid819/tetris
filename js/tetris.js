const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextBlockCanvas = document.getElementById('nextBlock');
const nextBlockContext = nextBlockCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 30;  
const tetrominoes = [
    { // O shape
        color: 'yellow',
        shape: [
            [1, 1],
            [1, 1]
        ]
    },
    { // T shape
        color: 'purple',
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },
    { // L shape
        color: 'orange',
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },
    { // J shape
        color: 'blue',
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    },
    { // S shape
        color: 'green',
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },
    { // Z shape
        color: 'red',
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },
    { // I shape
        color: 'cyan',
        shape: [
            [1, 1, 1, 1]
        ]
    }
];

let board = Array.from({ length: ROWS }).map(() => Array(COLUMNS).fill(0));
let currentTetromino = getRandomTetromino();
let nextTetromino = getRandomTetromino();
let position = resetPosition();
let score = 0;
let gameOver = false;
let gameStarted = false;

function resetPosition() {
    return { x: Math.floor(COLUMNS / 2) - 1, y: 0 };
}

function getRandomTetromino() {
    const randomTetromino = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
    return {...randomTetromino, shape: [...randomTetromino.shape]};
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw tetromino
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
                drawBlock(position.x + x, position.y + y, currentTetromino.color);
            }
        }
    }

    // Draw board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLUMNS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawNextBlock() {
    nextBlockContext.clearRect(0, 0, nextBlockCanvas.width, nextBlockCanvas.height);
    let tetromino = nextTetromino;
    for (let y = 0; y < tetromino.shape.length; y++) {
        for (let x = 0; x < tetromino.shape[y].length; x++) {
            if (tetromino.shape[y][x]) {
                const drawX = x + Math.max(0, 2 - tetromino.shape[0].length / 2);
                const drawY = y + Math.max(0, 2 - tetromino.shape.length / 2);
                drawNextBlockBlock(drawX, drawY, tetromino.color);
            }
        }
    }
}

function drawNextBlockBlock(x, y, color) {
    const blockSize = nextBlockCanvas.width / 4; 
    nextBlockContext.fillStyle = color;
    nextBlockContext.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    nextBlockContext.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

function collision() {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x] &&
                (board[y + position.y] && board[y + position.y][x + position.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function dropTetromino() {
    if (gameOver) {
        return;
    }

    position.y++;
    if (collision()) {
        position.y--;
        mergeTetromino();
        clearLines();
        currentTetromino = nextTetromino;
        nextTetromino = getRandomTetromino();
        position = resetPosition();
        drawNextBlock();
        if (collision()) {
            gameOver = true;
            gameStarted = false;
        }
    }
    draw();
}

function mergeTetromino() {
    for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
                board[y + position.y][x + position.x] = currentTetromino.color;
            }
        }
    }
}

function moveTetromino(dir) {
    position.x += dir;
    if (collision()) {
        position.x -= dir;
    }
}

function rotateTetromino() {
    const originalShape = currentTetromino.shape;
    currentTetromino.shape = currentTetromino.shape[0].map((val, index) => 
        currentTetromino.shape.map(row => row[index]).reverse()
    );
    if (collision()) {
        currentTetromino.shape = originalShape; 
    }
}

function clearLines() {
    let linesCleared = 0;

    for (let y = 0; y < ROWS; y++) {
        let rowFull = true;

        for (let x = 0; x < COLUMNS; x++) {
            if (!board[y][x]) {
                rowFull = false;
                break;
            }
        }

        if (rowFull) {
            linesCleared += 1;
            board.splice(y, 1);
            board.unshift(Array(COLUMNS).fill(0));
        }
    }

    switch (linesCleared) {
        case 1: score += 40; break;
        case 2: score += 100; break;
        case 3: score += 300; break;
        case 4: score += 1200; break;
    }
}

document.addEventListener('keydown', event => {
    if (!gameStarted) {
        return; 
    }
    
    if (event.key === 'ArrowLeft') {
        moveTetromino(-1);
    } else if (event.key === 'ArrowRight') {
        moveTetromino(1);
    } else if (event.key === 'ArrowDown') {
        dropTetromino();
    } else if (event.key === 'ArrowUp') {
        rotateTetromino();
    }
    draw();  
});

function endGame() {
    alert("Game Over! Your score is: " + score);
    document.location.reload();
}

function update() {
    if (!gameOver) {
        dropTetromino();
        scoreElement.textContent = "Score: " + score;
    } else {
        clearInterval(gameLoop); 
        endGame(); 
    }
}

let gameLoop;

function startGameLoop() {
    gameStarted = true;
    drawNextBlock();
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    gameLoop = setInterval(() => {
        update();
        draw();
    }, 1000);
}

export function startGame() {
    document.getElementById('startButton').style.display = 'none';
    gameStarted = true;

    startGameLoop();
}
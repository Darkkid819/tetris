const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 30;  // size of each block in the grid
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
let position = { x: Math.floor(COLUMNS / 2) - 1, y: 0 };
let score = 0;

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


let gameOver = false;

function dropTetromino() {
    position.y++;
    if (collision()) {
        position.y--;
        mergeTetromino();
        currentTetromino = getRandomTetromino();
        position.y = 0;
        position.x = Math.floor(COLUMNS / 2) - 1;
        if (collision()) {
            endGame();
        }
    }
}

function endGame() {
    alert("Game Over! Your score is: " + score);
    document.location.reload();
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
        position.x -= dir;  // Revert move if collision detected
    }
}

function rotateTetromino() {
    const originalShape = currentTetromino.shape;
    currentTetromino.shape = currentTetromino.shape[0].map((val, index) => 
        currentTetromino.shape.map(row => row[index]).reverse()
    );
    if (collision()) {
        currentTetromino.shape = originalShape;  // Revert rotation if collision detected
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        moveTetromino(-1);
    } else if (event.key === 'ArrowRight') {
        moveTetromino(1);
    } else if (event.key === 'ArrowDown') {
        dropTetromino();
    } else if (event.key === 'ArrowUp') {
        rotateTetromino();
    }
    draw();  // Redraw the canvas after any action
});

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
            board.splice(y, 1);  // Remove the full row
            board.unshift(Array(COLUMNS).fill(0));  // Add a new empty row at the top
        }
    }

    switch (linesCleared) {
        case 1: score += 40; break;
        case 2: score += 100; break;
        case 3: score += 300; break;
        case 4: score += 1200; break;
    }
}

function update() {
    dropTetromino();
    clearLines();
    scoreElement.textContent = "Score: " + score;
}

function startTetrisGameLoop() {
    setInterval(() => {
        update();
        draw();
    }, 1000);
}
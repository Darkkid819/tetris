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
        color: '#FFFF00',
        shape: [
            [1, 1],
            [1, 1]
        ]
    },
    { // T shape
        color: '#800080',
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ]
    },
    { // L shape
        color: '#FFA500',
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ]
    },
    { // J shape
        color: '#0000FF',
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ]
    },
    { // S shape
        color: '#008000',
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ]
    },
    { // Z shape
        color: '#FF0000',
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ]
    },
    { // I shape
        color: '#00FFFF',
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
let linesClearedCount = 0;
let currentLevel = 1;
let gameOver = false;
let gameStarted = false;
let isClearing = false;
let dropInterval;
let dropSpeed = 50;
let gameSpeed = 100;

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
                drawBlock(context, position.x + x, position.y + y, BLOCK_SIZE, currentTetromino.color);
            }
        }
    }

    // Draw board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLUMNS; x++) {
            if (board[y][x]) {
                drawBlock(context, x, y, BLOCK_SIZE, board[y][x]);
            }
        }
    }
}

function drawBlock(context, x, y, blockSize, color) {
    const topColor = shadeColor(color, 20);
    const leftColor = shadeColor(color, 20); 
    const rightColor = shadeColor(color, -20);
    const bottomColor = shadeColor(color, -20); 

    context.fillStyle = color;
    context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

    context.fillStyle = topColor;
    context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize * 0.1);

    context.fillStyle = leftColor;
    context.fillRect(x * blockSize, y * BLOCK_SIZE, blockSize * 0.1, blockSize);

    context.fillStyle = rightColor;
    context.fillRect((x + 1) * blockSize - blockSize * 0.1, y * blockSize, blockSize * 0.1, blockSize);

    context.fillStyle = bottomColor;
    context.fillRect(x * blockSize, (y + 1) * blockSize - blockSize * 0.1, blockSize, blockSize * 0.1);

    context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

function drawNextBlock() {
    nextBlockContext.clearRect(0, 0, nextBlockCanvas.width, nextBlockCanvas.height);
    let blockSize = nextBlockCanvas.width / 4;
    let tetromino = nextTetromino;

    for (let y = 0; y < tetromino.shape.length; y++) {
        for (let x = 0; x < tetromino.shape[y].length; x++) {
            if (tetromino.shape[y][x]) {
                const drawX = x + Math.max(0, 2 - tetromino.shape[0].length / 2);
                const drawY = y + Math.max(0, 2 - tetromino.shape.length / 2);
                drawBlock(nextBlockContext, drawX, drawY, blockSize, tetromino.color);
            }
        }
    }
}

function shadeColor(color, percent) {
    let num = parseInt(color.slice(1), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;

    R = (R < 255) ? ((R > 0) ? R : 0) : 255;
    G = (G < 255) ? ((G > 0) ? G : 0) : 255;
    B = (B < 255) ? ((B > 0) ? B : 0) : 255;

    return "#" + (R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0'));
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

function isGameOver() {
    for (let x = 0; x < COLUMNS; x++) {
        if (board[0][x] !== 0) {
            gameOver = true;
            return true;
        }
    }
    return false;
}

function dropTetromino() {
    if (gameOver || isClearing) {
        return;
    }

    position.y++;
    if (collision()) {
        position.y--;
        mergeTetromino();
        clearLines();
    } else {
        draw();
    }
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

function flashLines(linesToClear, callback) {
    let flashCount = 0;
    isClearing = true;
    let flashInterval = setInterval(() => {
        flashCount++;
        linesToClear.forEach(y => {
            for (let x = 0; x < COLUMNS; x++) {
                board[y][x] = flashCount % 2 === 0 ? '#FFFFFF' : '#000000';
            }
        });
        draw();

        if (flashCount > 5) { 
            clearInterval(flashInterval);
            isClearing = false;
            callback();
        }
    }, 150);
}

function clearLines() {
    let linesToClear = [];

    for (let y = 0; y < ROWS; y++) {
        let rowFull = true;
        for (let x = 0; x < COLUMNS; x++) {
            if (!board[y][x]) {
                rowFull = false;
                break;
            }
        }
        if (rowFull) {
            linesToClear.push(y);
        }
    }

    switch (linesToClear.length) {
        case 1: score += 40; break;
        case 2: score += 100; break;
        case 3: score += 300; break;
        case 4: score += 1200; break;
    }
    scoreElement.textContent = score;

    if (linesToClear.length > 0) {
        flashLines(linesToClear, () => {
            linesToClear.forEach(line => {
                board.splice(line, 1);
                board.unshift(Array(COLUMNS).fill(0));
            });
            
            linesClearedCount += linesToClear.length;
            const linesElement = document.getElementById('lines'); 
            linesElement.textContent = linesClearedCount;

            if (Math.floor(linesClearedCount / 10) + 1 > currentLevel) {
                currentLevel = Math.floor(linesClearedCount / 10) + 1;
                const levelElement = document.getElementById('level');
                levelElement.textContent = currentLevel;
                increaseGameSpeed();
            }

            setTimeout(() => {
                currentTetromino = nextTetromino;
                nextTetromino = getRandomTetromino();
                position = resetPosition();
                if (collision()) {
                    gameOver = true;
                    gameStarted = false;
                    endGame();
                } else {
                    drawNextBlock(); 
                    draw();
                }
            }, 0);
        });
    } else {
        currentTetromino = nextTetromino;
        nextTetromino = getRandomTetromino();
        position = resetPosition();
        drawNextBlock();
        draw();
    }
}

function increaseGameSpeed() {
    clearInterval(gameLoop);
    clearInterval(dropInterval);
    dropInterval = null;
    
    gameSpeed = Math.max(100, 1000 - (100 * (currentLevel - 1))); 
    
    gameLoop = setInterval(() => {
        update();
        draw();
    }, gameSpeed);
}

function handleKeyDown(event) {
    if (!gameStarted) {
        return; 
    }

    if (event.key === 'ArrowLeft') {
        moveTetromino(-1);
    } else if (event.key === 'ArrowRight') {
        moveTetromino(1);
    } else if (event.key === 'ArrowDown') {
        if (!dropInterval) {
            dropTetromino();
            dropInterval = setInterval(dropTetromino, dropSpeed);
        }
    } else if (event.key === 'ArrowUp') {
        rotateTetromino();
    }
    draw();  
}

function handleKeyUp(event) {
    if (event.key === 'ArrowDown') {
        clearInterval(dropInterval);
        dropInterval = null;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function endGame() {
    alert("Game Over! Your score is: " + score);
    document.location.reload();
}

function update() {
    if (!isClearing) {
        dropTetromino();
        scoreElement.textContent = score;
    }
    draw();
    if (isGameOver()) {
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
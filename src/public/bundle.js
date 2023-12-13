(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arena = void 0;
const events_1 = require("./events");
class Arena {
    constructor(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        this.matrix = matrix;
        this.events = new events_1.Events();
    }
    clear() {
        this.matrix.forEach(row => row.fill(0));
        this.events.emit('matrix', this.matrix);
    }
    collide(player) {
        if (!player.matrix) {
            return false;
        }
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.matrix[y + o.y] &&
                        this.matrix[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    merge(player) {
        if (!player.matrix) {
            return;
        }
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.matrix[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
        this.events.emit('matrix', this.matrix);
    }
    sweep() {
        let rowCount = 1;
        let score = 0;
        outer: for (let y = this.matrix.length - 1; y > 0; --y) {
            for (let x = 0; x < this.matrix[y].length; ++x) {
                if (this.matrix[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.matrix.splice(y, 1)[0].fill(0);
            this.matrix.unshift(row);
            ++y;
            score += rowCount * 10;
            rowCount *= 2;
        }
        this.events.emit('matrix', this.matrix);
        return score;
    }
}
exports.Arena = Arena;

},{"./events":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
class ConnectionManager {
    constructor(tetrisManager) {
        this.conn = null;
        this.peers = new Map();
        this.tetrisManager = tetrisManager;
        this.localTetris = this.tetrisManager.instances[0];
        this.updatePlayerCountDisplay(1);
        tetrisManager.instances.forEach(tetris => {
            tetris.onGameOver = () => this.checkAllPlayersGameOver();
        });
    }
    checkAllPlayersGameOver() {
        const allGameOver = this.tetrisManager.instances.every(tetris => tetris.gameOverCalled) &&
            Array.from(this.peers.values()).every(tetris => tetris.gameOverCalled);
        if (allGameOver) {
            this.showTotalScore();
        }
    }
    showTotalScore() {
        const totalScore = this.tetrisManager.instances.reduce((sum, tetris) => sum + tetris.player.score, 0);
        document.getElementById('game-container').style.display = 'none';
        const totalScoreElement = document.getElementById('total-score');
        if (totalScoreElement) {
            totalScoreElement.innerText = `Total Score: ${totalScore}`;
            totalScoreElement.style.display = 'block';
        }
    }
    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.initSession();
            this.watchEvents();
        });
        this.conn.addEventListener('message', event => {
            console.log('Received message', event.data);
            this.receive(event.data);
        });
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
    }
    initSession() {
        if (!this.localTetris) {
            console.error("Local Tetris instance is not initialized");
            return;
        }
        const sessionId = window.location.hash.split('#')[1];
        const state = this.localTetris.serialize();
        if (sessionId) {
            this.send({
                type: 'join-session',
                id: sessionId,
                state,
            });
        }
        else {
            this.send({
                type: 'create-session',
                state,
            });
        }
    }
    watchEvents() {
        const local = this.tetrisManager.instances[0];
        const player = local.player;
        player.events.listen('pos', () => {
            this.send({
                type: 'state-update',
                fragment: 'player',
                state: ['pos', player.pos],
            });
        });
        player.events.listen('matrix', () => {
            this.send({
                type: 'state-update',
                fragment: 'player',
                state: ['matrix', player.matrix],
            });
        });
        player.events.listen('score', () => {
            this.send({
                type: 'state-update',
                fragment: 'player',
                state: ['score', player.score],
            });
        });
        const arena = local.arena;
        arena.events.listen('matrix', () => {
            this.send({
                type: 'state-update',
                fragment: 'arena',
                state: ['matrix', arena.matrix],
            });
        });
    }
    updateManager(peers) {
        const me = peers.you;
        const clients = peers.clients.filter(client => me !== client.id);
        clients.forEach(client => {
            if (!this.peers.has(client.id)) {
                // Create a game instance for each new peer
                const tetris = this.tetrisManager.createPlayer();
                tetris.unserialize(client.state);
                this.peers.set(client.id, tetris);
            }
        });
        if (clients.length > 1) {
            // If more than 2 players try to connect, disconnect the additional players
            // Implement logic to disconnect additional players
            return;
        }
        // Update player count display
        this.updatePlayerCountDisplay(clients.length + 1); // +1 for local player
        // Enable start button if exactly two players are in the room
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.disabled = clients.length !== 1; // Enable only if one remote player
        }
    }
    updatePlayerCountDisplay(count) {
        const playerCountElement = document.getElementById('player-count');
        if (playerCountElement) {
            playerCountElement.innerText = `Players in room: ${count}/2`;
        }
    }
    startGame() {
        this.send({
            type: 'start-game',
        });
    }
    removeStartUI() {
        const playerCountElement = document.getElementById('player-count');
        const startGameBtn = document.getElementById('start-game-btn');
        if (playerCountElement && playerCountElement.parentNode) {
            playerCountElement.parentNode.removeChild(playerCountElement);
        }
        if (startGameBtn && startGameBtn.parentNode) {
            startGameBtn.parentNode.removeChild(startGameBtn);
        }
    }
    stopGame() {
        // Logic to stop or pause the game
        console.log("Game stopped");
        // Disable game controls, stop timers, etc.
    }
    updatePeer(id, fragment, [key, value]) {
        if (!this.peers.has(id)) {
            throw new Error('Client does not exist ' + id);
        }
        const tetris = this.peers.get(id);
        if (!tetris) {
            return;
        }
        switch (fragment) {
            case 'player':
                switch (key) {
                    case 'pos':
                        tetris.player.pos = value;
                        break;
                    case 'matrix':
                        tetris.player.matrix = value;
                        break;
                    case 'score':
                        tetris.player.score = value;
                        break;
                }
                break;
            case 'arena':
                if (key === 'matrix') {
                    tetris.arena.matrix = value;
                }
                break;
        }
        if (key === 'score') {
            tetris.updateScore(value);
        }
        else {
            tetris.draw();
        }
    }
    receive(msg) {
        const data = JSON.parse(msg);
        if (data.type === 'session-created') {
            window.location.hash = data.id;
        }
        else if (data.type === 'session-broadcast') {
            this.updateManager(data.peers);
        }
        else if (data.type === 'state-update') {
            this.updatePeer(data.clientId, data.fragment, data.state);
        }
        else if (data.type === 'start-game') {
            if (typeof window.startGame === 'function') {
                window.startGame();
            }
        }
        else if (data.type === 'game-over') {
            this.handleRemoteGameOver(data.clientId);
        }
    }
    handleRemoteGameOver(clientId) {
        const tetris = this.peers.get(clientId);
        if (tetris) {
            tetris.gameOverCalled = true;
            this.checkAllPlayersGameOver();
        }
    }
    send(data) {
        const msg = JSON.stringify(data);
        console.log('Sending message', msg);
        if (this.conn) {
            this.conn.send(msg);
        }
    }
}
exports.ConnectionManager = ConnectionManager;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
class Events {
    constructor() {
        this._listeners = new Set();
    }
    listen(name, callback) {
        this._listeners.add({
            name,
            callback,
        });
    }
    emit(name, ...data) {
        this._listeners.forEach(listener => {
            if (listener.name === name) {
                listener.callback(...data);
            }
        });
    }
}
exports.Events = Events;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tetris_manager_1 = require("./tetris-manager");
const connection_manager_1 = require("./connection-manager");
let gameStarted = false;
function startGame() {
    if (gameStarted)
        return;
    connectionManager.removeStartUI();
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.display = 'flex';
        gameContainer.style.justifyContent = 'center';
        gameContainer.style.alignItems = 'center';
    }
    tetrisManager.instances.forEach(tetris => {
        tetris.run();
    });
    document.addEventListener('keydown', keyListener);
    document.addEventListener('keyup', keyListener);
    gameStarted = true;
}
window.startGame = startGame;
const tetrisManager = new tetris_manager_1.TetrisManager(document);
const connectionManager = new connection_manager_1.ConnectionManager(tetrisManager);
const tetrisLocal = tetrisManager.createPlayer();
tetrisLocal.element.classList.add('local');
connectionManager.localTetris = tetrisLocal;
connectionManager.connect(`ws://${window.location.hostname}:${window.location.port}`);
const keyListener = (event) => {
    const player = tetrisLocal.player;
    if (event.type === 'keydown') {
        switch (event.key) {
            case 'ArrowLeft':
                player.move(-1);
                break;
            case 'ArrowRight':
                player.move(1);
                break;
            case 'ArrowUp':
                player.rotate(1);
                break;
            case 'ArrowDown':
                if (player.dropInterval !== player.DROP_FAST) {
                    player.drop();
                    player.dropInterval = player.DROP_FAST;
                }
                break;
        }
    }
    else if (event.type === 'keyup' && event.key === 'ArrowDown') {
        player.dropInterval = player.DROP_SLOW;
    }
};
document.addEventListener('keydown', keyListener);
document.addEventListener('keyup', keyListener);

},{"./connection-manager":2,"./tetris-manager":6}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const events_1 = require("./events");
class Player {
    constructor(tetris) {
        this.DROP_SLOW = 1000;
        this.DROP_FAST = 50;
        this.events = new events_1.Events();
        this.tetris = tetris;
        this.arena = tetris.arena;
        this.dropCounter = 0;
        this.dropInterval = this.DROP_SLOW;
        this.pos = { x: 0, y: 0 };
        this.matrix = null;
        this.score = 0;
        this.reset();
    }
    createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'L':
                return [
                    [0, 3, 0],
                    [0, 3, 0],
                    [0, 3, 3],
                ];
            case 'J':
                return [
                    [0, 4, 0],
                    [0, 4, 0],
                    [4, 4, 0],
                ];
            case 'I':
                return [
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0],
                ];
            default:
                throw new Error('Unknown piece type');
        }
    }
    drop() {
        this.pos.y++;
        this.dropCounter = 0;
        if (this.arena.collide(this)) {
            this.pos.y--;
            this.arena.merge(this);
            this.reset();
            this.score += this.arena.sweep();
            this.events.emit('score', this.score);
            return;
        }
        this.events.emit('pos', this.pos);
    }
    move(dir) {
        this.pos.x += dir;
        if (this.arena.collide(this)) {
            this.pos.x -= dir;
            return;
        }
        this.events.emit('pos', this.pos);
    }
    reset() {
        const pieces = 'ILJOTSZ';
        this.matrix = this.createPiece(pieces[Math.floor(pieces.length * Math.random())]);
        this.pos.y = 0;
        this.pos.x = (this.arena.matrix[0].length / 2 | 0) -
            (this.matrix[0].length / 2 | 0);
        if (this.arena.collide(this)) {
            this.arena.clear();
            this.events.emit('game-over'); // Emit the game-over event and do not start a new game
            this.tetris.notifyGameOver();
            return;
        }
        this.events.emit('pos', this.pos);
        this.events.emit('matrix', this.matrix);
    }
    rotate(dir) {
        const pos = this.pos.x;
        let offset = 1;
        this._rotateMatrix(this.matrix, dir);
        while (this.arena.collide(this)) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.matrix[0].length) {
                this._rotateMatrix(this.matrix, -dir);
                this.pos.x = pos;
                return;
            }
        }
        this.events.emit('matrix', this.matrix);
    }
    _rotateMatrix(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        }
        else {
            matrix.reverse();
        }
    }
    update(deltaTime) {
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
    }
}
exports.Player = Player;

},{"./events":3}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TetrisManager = void 0;
const tetris_1 = require("./tetris"); // Import the Tetris class
class TetrisManager {
    constructor(document) {
        this.document = document;
        this.template = this.document.querySelector('#player-template');
        this.instances = [];
    }
    createPlayer() {
        const element = this.document.importNode(this.template.content, true).children[0];
        const gameContainer = this.document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(element);
        }
        else {
            console.error('Game container not found');
        }
        const tetris = new tetris_1.Tetris(element);
        this.instances.push(tetris);
        return tetris;
    }
    removePlayer(tetris) {
        this.document.body.removeChild(tetris.element);
        this.instances = this.instances.filter(instance => instance !== tetris);
    }
    sortPlayers(tetri) {
        tetri.forEach(tetris => {
            this.document.body.appendChild(tetris.element);
        });
    }
}
exports.TetrisManager = TetrisManager;

},{"./tetris":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tetris = void 0;
const arena_1 = require("./arena");
const player_1 = require("./player");
class Tetris {
    constructor(element, connectionManager = null) {
        this.animationId = null;
        this.gameOverCalled = false;
        this.connectionManager = connectionManager;
        this.element = element;
        this.canvas = element.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.context.scale(20, 20);
        this.arena = new arena_1.Arena(12, 20);
        this.player = new player_1.Player(this);
        this.player.events.listen('score', score => {
            this.updateScore(score);
        });
        this.player.events.listen('game-over', () => {
            this.gameOver();
        });
        this.onGameOver = () => { };
        this.colors = [
            null,
            '#800080',
            '#FFFF00',
            '#FFA500',
            '#0000FF',
            '#00FFFF',
            '#008000',
            '#FF0000',
        ];
        let lastTime = 0;
        this._update = (time = 0) => {
            const deltaTime = time - lastTime;
            lastTime = time;
            this.player.update(deltaTime);
            if (!this.gameOverCalled) {
                this.animationId = requestAnimationFrame(this._update);
                this.draw();
            }
        };
        this.updateScore(0);
    }
    draw() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawMatrix(this.arena.matrix, { x: 0, y: 0 });
        if (this.player.matrix) {
            this.drawMatrix(this.player.matrix, this.player.pos);
        }
    }
    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const color = this.colors[value] || '#FFF';
                    this.drawBlock(x, y, color, { x: offset.x, y: offset.y });
                }
            });
        });
    }
    drawBlock(x, y, color, offset) {
        const topColor = this.shadeColor(color, 20);
        const leftColor = this.shadeColor(color, 20);
        const rightColor = this.shadeColor(color, -20);
        const bottomColor = this.shadeColor(color, -20);
        this.context.fillStyle = color;
        this.context.fillRect(x + offset.x, y + offset.y, 1, 1);
        this.context.fillStyle = topColor;
        this.context.fillRect(x + offset.x, y + offset.y, 1, 0.1);
        this.context.fillStyle = leftColor;
        this.context.fillRect(x + offset.x, y + offset.y, 0.1, 1);
        this.context.fillStyle = rightColor;
        this.context.fillRect((x + 1) + offset.x - 0.1, y + offset.y, 0.1, 1);
        this.context.fillStyle = bottomColor;
        this.context.fillRect(x + offset.x, (y + 1) + offset.y - 0.1, 1, 0.1);
    }
    shadeColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        let R = (num >> 16) + amt;
        let G = ((num >> 8) & 0x00FF) + amt;
        let B = (num & 0x0000FF) + amt;
        R = (R < 255) ? ((R > 0) ? R : 0) : 255;
        G = (G < 255) ? ((G > 0) ? G : 0) : 255;
        B = (B < 255) ? ((B > 0) ? B : 0) : 255;
        return "#" + (R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0'));
    }
    gameOver() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameOverCalled = true;
        this.notifyGameOver();
        this.context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = '#FFF';
        this.context.font = '1px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    }
    notifyGameOver() {
        if (this.connectionManager) {
            this.connectionManager.send({ type: 'game-over', from: this.connectionManager.localTetris });
        }
    }
    run() {
        this._update();
    }
    serialize() {
        return {
            arena: {
                matrix: this.arena.matrix,
            },
            player: {
                matrix: this.player.matrix,
                pos: this.player.pos,
                score: this.player.score,
            },
        };
    }
    unserialize(state) {
        this.arena = Object.assign(state.arena);
        this.player = Object.assign(state.player);
        this.updateScore(this.player.score);
        this.draw();
    }
    updateScore(score) {
        const scoreElement = this.element.querySelector('.score');
        if (scoreElement) {
            scoreElement.innerText = score.toString();
        }
    }
}
exports.Tetris = Tetris;

},{"./arena":1,"./player":5}]},{},[4]);

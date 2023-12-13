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

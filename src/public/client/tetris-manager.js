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

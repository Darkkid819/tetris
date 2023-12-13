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

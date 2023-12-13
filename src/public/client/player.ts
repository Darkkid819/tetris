import { Events } from './events';
import { Tetris } from './tetris'; // Assuming you have a Tetris class
import { Arena } from './arena';   // Assuming you have an Arena class

type Piece = number[][];

class Player {
    readonly DROP_SLOW: number = 1000;
    readonly DROP_FAST: number = 50;
    events: Events;
    tetris: Tetris;
    arena: Arena;
    dropCounter: number;
    dropInterval: number;
    pos: { x: number; y: number };
    matrix: Piece | null;
    score: number;

    constructor(tetris: Tetris) {
        this.events = new Events();
        this.tetris = tetris;
        this.arena = tetris.arena;
        this.dropCounter = 0;
        this.dropInterval = this.DROP_SLOW;
        this.pos = { x: 0, y: 0 };
        this.matrix = null;
        this.score = 0;
        this.reset();
    }

    createPiece(type: string): Piece {
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

    drop(): void {
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

    move(dir: number): void {
        this.pos.x += dir;
        if (this.arena.collide(this)) {
            this.pos.x -= dir;
            return;
        }
        this.events.emit('pos', this.pos);
    }

    reset(): void {
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


    rotate(dir: number): void {
        const pos = this.pos.x;
        let offset = 1;
        this._rotateMatrix(this.matrix as Piece, dir);
        while (this.arena.collide(this)) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > (this.matrix as Piece)[0].length) {
                this._rotateMatrix(this.matrix as Piece, -dir);
                this.pos.x = pos;
                return;
            }
        }
        this.events.emit('matrix', this.matrix);
    }

    private _rotateMatrix(matrix: Piece, dir: number): void {
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
        } else {
            matrix.reverse();
        }
    }

    public update(deltaTime: number): void {
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
    }
}

export { Player };


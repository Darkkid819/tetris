import { Arena } from './arena'; 
import { Player } from './player'; 
import { ConnectionManager } from './connection-manager';

class Tetris {
    element: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    arena: Arena;
    player: Player;
    colors: (string | null)[];
    private _update: (time?: number) => void;
    private animationId: number | null = null;
    public gameOverCalled = false;
    connectionManager: ConnectionManager | null;

    constructor(element: HTMLElement, connectionManager: ConnectionManager | null = null) {
        this.connectionManager = connectionManager;
        this.element = element;
        this.canvas = element.querySelector('canvas') as HTMLCanvasElement;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.context.scale(20, 20);

        this.arena = new Arena(12, 20);
        this.player = new Player(this);
        this.player.events.listen('score', score => {
            this.updateScore(score);
        });

        this.player.events.listen('game-over', () => {
            this.gameOver();
        });

        this.onGameOver = () => {};

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
        this._update = (time: number = 0) => {
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

    draw(): void {
      this.context.fillStyle = '#000';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.drawMatrix(this.arena.matrix, {x: 0, y: 0});
      if (this.player.matrix) {
          this.drawMatrix(this.player.matrix, this.player.pos);
      }
    }

    drawMatrix(matrix: number[][], offset: {x: number; y: number}): void {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const color = this.colors[value] || '#FFF'; 
                    this.drawBlock(x, y, color, { x: offset.x, y: offset.y }); 
                }
            });
        });
    }

    
    private drawBlock(x: number, y: number, color: string, offset: { x: number; y: number }): void {
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

    private shadeColor(color: string, percent: number): string {
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

    public onGameOver: () => void;

    gameOver(): void {
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

    notifyGameOver(): void {
        if (this.connectionManager) {
            this.connectionManager.send({ type: 'game-over', from: this.connectionManager.localTetris });
        }
    }
    


    run(): void {
        this._update();
    }

    serialize(): object {
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

    unserialize(state: any): void {
        this.arena = Object.assign(state.arena);
        this.player = Object.assign(state.player);
        this.updateScore(this.player.score);
        this.draw();
    }

    updateScore(score: number): void {
      const scoreElement = this.element.querySelector('.score') as HTMLElement; 
      if (scoreElement) {
          scoreElement.innerText = score.toString();
      }
  }
}

export { Tetris };

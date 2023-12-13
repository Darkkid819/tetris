import { Tetris } from './tetris'; // Import the Tetris class
import { ConnectionManager } from './connection-manager';

class TetrisManager {
    document: Document;
    template: HTMLTemplateElement;
    instances: Tetris[];

    constructor(document: Document) {
        this.document = document;
        this.template = this.document.querySelector('#player-template') as HTMLTemplateElement;

        this.instances = [];
    }

    createPlayer(): Tetris {
        const element = this.document.importNode(this.template.content, true).children[0] as HTMLElement;
        const gameContainer = this.document.getElementById('game-container');
        
        if (gameContainer) {
            gameContainer.appendChild(element);
        } else {
            console.error('Game container not found');
        }

        const tetris = new Tetris(element);
        this.instances.push(tetris);

        return tetris;
    }

    removePlayer(tetris: Tetris): void {
        this.document.body.removeChild(tetris.element);

        this.instances = this.instances.filter(instance => instance !== tetris);
    }

    sortPlayers(tetri: Tetris[]): void {
        tetri.forEach(tetris => {
            this.document.body.appendChild(tetris.element);
        });
    }
}

export { TetrisManager };

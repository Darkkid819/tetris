import { TetrisManager } from './tetris-manager';
import { Tetris } from './tetris';

class ConnectionManager {
    conn: WebSocket | null;
    peers: Map<string, Tetris>;
    tetrisManager: TetrisManager;
    localTetris: Tetris;

    constructor(tetrisManager: TetrisManager) {
        this.conn = null;
        this.peers = new Map();

        this.tetrisManager = tetrisManager;
        this.localTetris = this.tetrisManager.instances[0];

        this.updatePlayerCountDisplay(1);

        tetrisManager.instances.forEach(tetris => {
            tetris.onGameOver = () => this.checkAllPlayersGameOver();
        });
    }

    checkAllPlayersGameOver(): void {
        const allGameOver = this.tetrisManager.instances.every(tetris => tetris.gameOverCalled) &&
                            Array.from(this.peers.values()).every(tetris => tetris.gameOverCalled);
    
        if (allGameOver) {
            this.showTotalScore();
        }
    }

    private showTotalScore() {
        const totalScore = this.tetrisManager.instances.reduce((sum, tetris) => sum + tetris.player.score, 0);
        (document.getElementById('game-container') as HTMLElement).style.display = 'none';
        const totalScoreElement = document.getElementById('total-score');
        if (totalScoreElement) {
            totalScoreElement.innerText = `Total Score: ${totalScore}`;
            totalScoreElement.style.display = 'block';
        }
    }

    connect(address: string): void {
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

        const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement | null;
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
    }

    initSession(): void {
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
        } else {
            this.send({
                type: 'create-session',
                state,
            });
        }
    }

    watchEvents(): void {
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

    updateManager(peers: { you: string; clients: Array<{ id: string; state: any }> }): void {
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
        const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement | null;
        if (startGameBtn) {
            startGameBtn.disabled = clients.length !== 1; // Enable only if one remote player
        }
    }

    updatePlayerCountDisplay(count: number) {
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

    updatePeer(id: string, fragment: string, [key, value]: [string, any]): void {
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
      } else {
          tetris.draw();
      }
  }

    receive(msg: string): void {
        const data = JSON.parse(msg);
        if (data.type === 'session-created') {
            window.location.hash = data.id;
        } else if (data.type === 'session-broadcast') {
            this.updateManager(data.peers);
        } else if (data.type === 'state-update') {
            this.updatePeer(data.clientId, data.fragment, data.state);
        } else if (data.type === 'start-game') {
            if (typeof window.startGame === 'function') {
                window.startGame();
            }
        } else if (data.type === 'game-over') {
            this.handleRemoteGameOver(data.clientId);
        }
    }

    handleRemoteGameOver(clientId: string): void {
        const tetris = this.peers.get(clientId);
        if (tetris) {
            tetris.gameOverCalled = true;
            this.checkAllPlayersGameOver();
        }
    }

    send(data: object): void {
        const msg = JSON.stringify(data);
        console.log('Sending message', msg);
        if (this.conn) {
            this.conn.send(msg);
        }
    }
}

export { ConnectionManager };

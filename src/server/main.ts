import http from 'http';
import express from 'express';
import { Server as WebSocketServer } from 'ws';
import WebSocket from 'ws';
import Session from './session';
import Client from './client';

function createId(len: number = 6, chars: string = 'abcdefghjkmnopqrstvwxyz01234567890'): string {
    let id = '';
    while (len--) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

function createClient(conn: WebSocket, id: string = createId()): Client {
    return new Client(conn, id);
}

function createSession(id: string = createId()): Session {
    if (sessions.has(id)) {
        throw new Error(`Session ${id} already exists`);
    }

    const session = new Session(id);
    console.log('Creating session', session);

    sessions.set(id, session);

    return session;
}

function getSession(id: string): Session | undefined {
    return sessions.get(id);
}

function broadcastSession(session: Session): void {
    const clients = Array.from(session.clients);
    clients.forEach(client => {
        const message = JSON.stringify({
            type: 'session-broadcast',
            peers: {
                you: client.id,
                clients: clients.map(client => {
                    return {
                        id: client.id,
                        state: client.state,
                    };
                }),
            },
        });

        client.send(message); 
    });
}

function broadcastStartGame(session: Session): void {
    const startGameMessage = JSON.stringify({ type: 'start-game' });
    session.clients.forEach(client => {
      client.send(startGameMessage);
    });
}

const sessions = new Map<string, Session>();

const app = express();
app.use(express.static('src/public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is listening on port ${port}`));

interface CreateSessionMessage {
  type: 'create-session';
  state: any; // Replace with a more specific type if possible
}

interface JoinSessionMessage {
  type: 'join-session';
  id: string;
  state: any; // Replace with a more specific type if possible
}

interface StateUpdateMessage {
  type: 'state-update';
  fragment: string;
  state: [string, any]; // Replace with a more specific type if possible
}

interface StartGameMessage {
    type: 'start-game';
  }

interface GameOverMessage {
    type: 'game-over';
}


  type ClientMessage = CreateSessionMessage | JoinSessionMessage | StateUpdateMessage | StartGameMessage;

wss.on('connection', (conn: WebSocket) => {
  console.log('Connection established');
  const client = createClient(conn);

  conn.on('message', (msg: string) => {
      console.log('Message received', msg);
      const data: ClientMessage | GameOverMessage = JSON.parse(msg);
      
      if (data.type === 'create-session') {
          const session = createSession();
          session.join(client);

          client.state = data.state;
          client.send(JSON.stringify({
            type: 'session-created',
            id: session.id,
        }));        
      } else if (data.type === 'join-session') {
          const session = getSession(data.id) || createSession(data.id);
          session.join(client);

          client.state = data.state;
          broadcastSession(session);
      } else if (data.type === 'state-update') {
            const [key, value] = data.state;
            
            if (data.fragment === 'arena' || data.fragment === 'player') {
                const fragmentState = (client.state as any)[data.fragment];
                if (typeof fragmentState === 'object' && fragmentState !== null) {
                    fragmentState[key as keyof typeof fragmentState] = value;
                    client.broadcast(data);
                }
            }
      } else if (data.type === 'start-game') {
        const session = client.session;
        if (session) {
          broadcastStartGame(session);
        }
      } else if (data.type === 'game-over') {
        const session = client.session;
        if (session) {
            session.clients.forEach(c => {
                if (c !== client) {
                    c.send(JSON.stringify({ type: 'game-over', from: client.id }));
                }
            });
        }
    }
  });

  conn.on('close', () => {
    console.log('Connection closed');
    const session = client.session;
    if (session) {
        session.leave(client);
        
        if (session.clients.size === 0) {
            sessions.delete(session.id);
        } else {
            broadcastSession(session);  
        }
    }

    console.log(sessions);
});

});
import WebSocket from 'ws';
import Session from './session'; 

class Client {
    conn: WebSocket;
    id: string;
    session: Session | null;
    state: {
        arena: {
            matrix: number[][];
        };
        player: {
            matrix: number[][];
            pos: { x: number; y: number };
            score: number;
        };
    };

    constructor(conn: WebSocket, id: string) {
        this.conn = conn;
        this.id = id;
        this.session = null;

        this.state = {
            arena: {
                matrix: [],
            },
            player: {
                matrix: [],
                pos: { x: 0, y: 0 },
                score: 0,
            },
        };
    }

    broadcast(data: object): void {
        if (!this.session) {
            throw new Error('Cannot broadcast without session');
        }

        const message = JSON.stringify({ ...data, clientId: this.id });
        this.session.clients.forEach(client => {
            if (client !== this) {
                client.send(message);  
            }
        });
    }

    send(data: string): void {  
        console.log(`Sending message ${data}`);
        this.conn.send(data, function ack(err) {
            if (err) {
                console.log('Error sending message', data, err);
            }
        });
    }
}

export default Client;

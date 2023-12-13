"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Client {
    constructor(conn, id) {
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
    broadcast(data) {
        if (!this.session) {
            throw new Error('Cannot broadcast without session');
        }
        const message = JSON.stringify(Object.assign(Object.assign({}, data), { clientId: this.id }));
        this.session.clients.forEach(client => {
            if (client !== this) {
                client.send(message);
            }
        });
    }
    send(data) {
        console.log(`Sending message ${data}`);
        this.conn.send(data, function ack(err) {
            if (err) {
                console.log('Error sending message', data, err);
            }
        });
    }
}
exports.default = Client;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const session_1 = __importDefault(require("./session"));
const client_1 = __importDefault(require("./client"));
function createId(len = 6, chars = 'abcdefghjkmnopqrstvwxyz01234567890') {
    let id = '';
    while (len--) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}
function createClient(conn, id = createId()) {
    return new client_1.default(conn, id);
}
function createSession(id = createId()) {
    if (sessions.has(id)) {
        throw new Error(`Session ${id} already exists`);
    }
    const session = new session_1.default(id);
    console.log('Creating session', session);
    sessions.set(id, session);
    return session;
}
function getSession(id) {
    return sessions.get(id);
}
function broadcastSession(session) {
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
function broadcastStartGame(session) {
    const startGameMessage = JSON.stringify({ type: 'start-game' });
    session.clients.forEach(client => {
        client.send(startGameMessage);
    });
}
const sessions = new Map();
const app = (0, express_1.default)();
app.use(express_1.default.static('src/public'));
const server = http_1.default.createServer(app);
const wss = new ws_1.Server({ server });
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is listening on port ${port}`));
wss.on('connection', (conn) => {
    console.log('Connection established');
    const client = createClient(conn);
    conn.on('message', (msg) => {
        console.log('Message received', msg);
        const data = JSON.parse(msg);
        if (data.type === 'create-session') {
            const session = createSession();
            session.join(client);
            client.state = data.state;
            client.send(JSON.stringify({
                type: 'session-created',
                id: session.id,
            }));
        }
        else if (data.type === 'join-session') {
            const session = getSession(data.id) || createSession(data.id);
            session.join(client);
            client.state = data.state;
            broadcastSession(session);
        }
        else if (data.type === 'state-update') {
            const [key, value] = data.state;
            if (data.fragment === 'arena' || data.fragment === 'player') {
                const fragmentState = client.state[data.fragment];
                if (typeof fragmentState === 'object' && fragmentState !== null) {
                    fragmentState[key] = value;
                    client.broadcast(data);
                }
            }
        }
        else if (data.type === 'start-game') {
            const session = client.session;
            if (session) {
                broadcastStartGame(session);
            }
        }
        else if (data.type === 'game-over') {
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
            }
            else {
                broadcastSession(session);
            }
        }
        console.log(sessions);
    });
});

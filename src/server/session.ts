import Client from './client'; 

class Session {
    id: string;
    clients: Set<Client>;

    constructor(id: string) {
        this.id = id;
        this.clients = new Set<Client>();
    }

    join(client: Client): void {
        if (client.session) {
            throw new Error('Client already in session');
        }
        this.clients.add(client);
        client.session = this;
    }

    leave(client: Client): void {
        if (client.session !== this) {
            throw new Error('Client not in session');
        }
        this.clients.delete(client);
        client.session = null;
    }
}

export default Session;

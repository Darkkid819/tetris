type ListenerCallback = (...args: any[]) => void;

interface Listener {
    name: string;
    callback: ListenerCallback;
}

class Events {
    private _listeners: Set<Listener>;

    constructor() {
        this._listeners = new Set();
    }

    listen(name: string, callback: ListenerCallback): void {
        this._listeners.add({
            name,
            callback,
        });
    }

    emit(name: string, ...data: any[]): void {
        this._listeners.forEach(listener => {
            if (listener.name === name) {
                listener.callback(...data);
            }
        });
    }
}

export { Events };

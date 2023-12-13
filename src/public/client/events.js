"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
class Events {
    constructor() {
        this._listeners = new Set();
    }
    listen(name, callback) {
        this._listeners.add({
            name,
            callback,
        });
    }
    emit(name, ...data) {
        this._listeners.forEach(listener => {
            if (listener.name === name) {
                listener.callback(...data);
            }
        });
    }
}
exports.Events = Events;

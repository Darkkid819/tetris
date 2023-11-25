package com.tetris.service;

import com.tetris.model.GameState;

public interface _GameStateBroadcaster {
    void broadcastState(GameState gameState);
}

package com.tetris.service;

import com.tetris.model.GameRoom;
import com.tetris.model.Player;

public interface _GameService {
    GameRoom createGameRoom(Player player);
    boolean joinGameRoom(String roomCode, Player player);
    void leaveGameRoom(String roomCode, Player player);
}

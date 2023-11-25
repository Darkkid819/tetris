package com.tetris.service;

import com.tetris.model.GameRoom;
import com.tetris.model.Player;

public interface _RoomManagement {
    GameRoom createRoom(Player player);
    boolean joinRoom(String roomCode, Player player);
    void leaveRoom(String roomCode, Player player);
}

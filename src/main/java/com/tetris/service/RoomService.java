package com.tetris.service;

import com.tetris.model.GameRoom;
import com.tetris.model.Player;
import com.tetris.util.RoomCodeGenerator;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomService implements _RoomManagement {

    private final Map<String, GameRoom> activeRooms;

    public RoomService() {
        this.activeRooms = new ConcurrentHashMap<>();
    }

    @Override
    public GameRoom createRoom(Player player) {
        String roomCode = RoomCodeGenerator.generate();
        if (activeRooms.containsKey(roomCode)) {
            // Handle the event of a room code collision.
            roomCode = RoomCodeGenerator.generateUnique(activeRooms.keySet());
        }

        GameRoom room = new GameRoom(roomCode);
        room.addPlayer(player);
        activeRooms.put(roomCode, room);
        return room;
    }

    @Override
    public boolean joinRoom(String roomCode, Player player) {
        GameRoom room = activeRooms.get(roomCode);
        if (room != null && room.getPlayers().size() < 2) {
            room.addPlayer(player);
            return true;
        }
        return false;
    }

    @Override
    public void leaveRoom(String roomCode, Player player) {
        GameRoom room = activeRooms.get(roomCode);
        if (room != null) {
            room.removePlayer(player);
            if (room.getPlayers().isEmpty()) {
                activeRooms.remove(roomCode);
            }
        }
    }
}

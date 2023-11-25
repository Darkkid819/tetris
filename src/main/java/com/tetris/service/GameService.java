package com.tetris.service;

import com.tetris.model.GameRoom;
import com.tetris.model.Player;
import com.tetris.repository.GameRoomRepository;
import com.tetris.util.RoomCodeGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService implements _GameService {

    private final GameRoomRepository gameRoomRepository;
    private final Map<String, GameRoom> activeGameRooms;

    @Autowired
    public GameService(GameRoomRepository gameRoomRepository) {
        this.gameRoomRepository = gameRoomRepository;
        this.activeGameRooms = new ConcurrentHashMap<>();
    }

    @Override
    public GameRoom createGameRoom(Player player) {
        String roomCode = RoomCodeGenerator.generate();
        while (gameRoomRepository.findByRoomCode(roomCode).isPresent()) {
            roomCode = RoomCodeGenerator.generate();
        }
        GameRoom newRoom = new GameRoom(roomCode);
        newRoom.addPlayer(player);
        gameRoomRepository.save(newRoom);
        activeGameRooms.put(roomCode, newRoom);
        return newRoom;
    }

    @Override
    public boolean joinGameRoom(String roomCode, Player player) {
        GameRoom room = activeGameRooms.get(roomCode);
        if (room == null) {
            Optional<GameRoom> optionalRoom = gameRoomRepository.findByRoomCode(roomCode);
            if (optionalRoom.isPresent()) {
                room = optionalRoom.get();
                activeGameRooms.put(roomCode, room);
            } else {
                return false;
            }
        }
        if (room.addPlayer(player)) {
            gameRoomRepository.save(room);
            return true;
        }
        return false;
    }

    @Override
    public void leaveGameRoom(String roomCode, Player player) {
        GameRoom room = activeGameRooms.get(roomCode);
        if (room != null) {
            room.removePlayer(player);
            gameRoomRepository.save(room);
            if (room.getPlayers().isEmpty()) {
                activeGameRooms.remove(roomCode);
                gameRoomRepository.delete(room);
            }
        }
    }

    // Additional methods to support all needed room operations can be added here
}
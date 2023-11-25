package com.tetris.controller;

import com.tetris.model.GameRoom;
import com.tetris.model.Player;
import com.tetris.service._GameService;
import com.tetris.service._RoomManagement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/game")
public class GameController {

    private final _GameService gameService;
    private final _RoomManagement roomManagement;

    @Autowired
    public GameController(_GameService gameService, _RoomManagement roomManagement) {
        this.gameService = gameService;
        this.roomManagement = roomManagement;
    }

    @PostMapping("/create")
    public ResponseEntity<GameRoom> createRoom(@RequestBody String playerName) {
        Player player = new Player(playerName);
        GameRoom gameRoom = roomManagement.createRoom(player);
        return ResponseEntity.ok(gameRoom);
    }

    @PostMapping("/join")
    public ResponseEntity<String> joinRoom(@RequestParam String roomCode, @RequestBody String playerName) {
        Player player = new Player(playerName);
        boolean success = roomManagement.joinRoom(roomCode, player);
        if (success) {
            return ResponseEntity.ok("Joined room successfully.");
        } else {
            return ResponseEntity.badRequest().body("Failed to join room.");
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<String> leaveRoom(@RequestParam String roomCode, @RequestBody String playerName) {
        Player player = new Player(playerName);
        roomManagement.leaveRoom(roomCode, player);
        return ResponseEntity.ok("Left room successfully.");
    }
}
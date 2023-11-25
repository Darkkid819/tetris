package com.tetris.controller;


import com.tetris.service._GameStateBroadcaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;
import com.tetris.model.GameState;
import com.tetris.service.GameService;

@Controller
public class WebSocketController {

    private final _GameStateBroadcaster gameStateBroadcaster;

    @Autowired
    public WebSocketController(_GameStateBroadcaster gameStateBroadcaster) {
        this.gameStateBroadcaster = gameStateBroadcaster;
    }

    @MessageMapping("/game/move")
    @SendTo("/topic/gamestate")
    public GameState handleGameMove(GameState gameState) {
        // Process the game move here. This could involve updating the game state,
        // checking for game over conditions, etc.
        gameStateBroadcaster.broadcastState(gameState);
        return gameState;
    }

    // More message mappings can be added for different types of game actions.
}
package com.tetris.service;

import com.tetris.model.GameState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class GameStateBroadcaster implements _GameStateBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public GameStateBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void broadcastState(GameState gameState) {
        // The "/topic/gamestate" destination must match the @SendTo annotation in your WebSocketController
        messagingTemplate.convertAndSend("/topic/gamestate", gameState);
    }
}

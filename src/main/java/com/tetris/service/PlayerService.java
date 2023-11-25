package com.tetris.service;

import com.tetris.model.Player;
import com.tetris.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlayerService implements _PlayerService {

    private final PlayerRepository playerRepository;

    @Autowired
    public PlayerService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Override
    public Player createPlayer(String displayName) {
        Player player = new Player(displayName);
        playerRepository.save(player);
        return player;
    }

}

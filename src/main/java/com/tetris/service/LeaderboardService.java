package com.tetris.service;

import com.tetris.model.Player;
import com.tetris.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaderboardService implements _LeaderboardService {

    private final PlayerRepository playerRepository;

    @Autowired
    public LeaderboardService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Override
    public void recordScore(Player player, int score) {
        player.setScore(score);
        playerRepository.save(player);
    }

    @Override
    public List<Player> getTopPlayers(int limit) {
        return playerRepository.findTopPlayers(limit);
    }
}

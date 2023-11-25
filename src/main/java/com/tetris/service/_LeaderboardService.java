package com.tetris.service;

import com.tetris.model.Player;

import java.util.List;

public interface _LeaderboardService {
    void recordScore(Player player, int score);
    List<Player> getTopPlayers(int limit);
}

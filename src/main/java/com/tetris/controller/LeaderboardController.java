package com.tetris.controller;

import com.tetris.model.Player;
import com.tetris.service._LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/leaderboard")
public class LeaderboardController {

    private final _LeaderboardService leaderboardService;

    @Autowired
    public LeaderboardController(_LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/top-players")
    public ResponseEntity<List<Player>> getTopPlayers(@RequestParam(defaultValue = "10") int limit) {
        List<Player> topPlayers = leaderboardService.getTopPlayers(limit);
        return ResponseEntity.ok(topPlayers);
    }

    // Additional endpoints for other leaderboard functionalities can be added here
}

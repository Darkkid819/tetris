package com.tetris.repository;

import com.tetris.model.Player;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends CrudRepository<Player, Long> {
    @Query("SELECT p FROM Player p ORDER BY p.score DESC")
    List<Player> findTopPlayers(int limit);
    Optional<Player> findByDisplayName(String displayName);
}

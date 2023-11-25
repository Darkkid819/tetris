package com.tetris.repository;

import com.tetris.model.GameRoom;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

@Repository
public interface GameRoomRepository extends CrudRepository<GameRoom, String> {
    Optional<GameRoom> findByRoomCode(String roomCode);

}

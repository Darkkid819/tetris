package com.tetris.model;

import com.tetris.util.RoomCodeGenerator;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
public class GameRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomCode;
    @OneToMany(mappedBy = "gameRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Player> players;

    public GameRoom() {
        this(RoomCodeGenerator.generate());
    }

    public GameRoom(String roomCode) {
        this.roomCode = roomCode;
        this.players = new HashSet<>();
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Set<Player> getPlayers() {
        return players;
    }

    public void setPlayers(Set<Player> players) {
        this.players = players;
    }

    public boolean addPlayer(Player player) {
        if (players.size() < 2) {
            return players.add(player);
        }
        return false;
    }

    public boolean removePlayer(Player player) {
        return players.remove(player);
    }
}
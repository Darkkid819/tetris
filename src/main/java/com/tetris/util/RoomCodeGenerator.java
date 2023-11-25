package com.tetris.util;

import java.util.Set;
import java.util.UUID;

public class RoomCodeGenerator {

    public static String generate() {
        // Simple UUIDs could be too long for a room code; may want to shorten
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public static String generateUnique(Set<String> existingCodes) {
        String newCode;
        do {
            newCode = generate();
        } while (existingCodes.contains(newCode));
        return newCode;
    }
}

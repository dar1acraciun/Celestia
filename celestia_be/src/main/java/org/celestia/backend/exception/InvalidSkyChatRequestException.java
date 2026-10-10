package org.celestia.backend.exception;

public class InvalidSkyChatRequestException extends RuntimeException {
    public InvalidSkyChatRequestException(String message) {
        super(message);
    }
}

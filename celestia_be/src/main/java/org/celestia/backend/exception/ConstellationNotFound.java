package org.celestia.backend.exception;

public class ConstellationNotFound extends RuntimeException {
    public ConstellationNotFound(String message) {
        super(message);
    }
}

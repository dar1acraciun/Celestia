package org.celestia.backend.dto;

import org.springframework.http.HttpStatus;

public record ErrorMessage (int status, String message) {
}

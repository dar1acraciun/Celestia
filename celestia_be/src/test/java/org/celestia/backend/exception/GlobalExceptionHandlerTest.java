package org.celestia.backend.exception;

import org.celestia.backend.dto.ErrorMessage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void userAlreadyExistException_returns409ErrorMessage() {
        ErrorMessage result = handler.userAlreadyExistException(new UserAlreadyExistException("User already exists"));

        assertThat(result.status()).isEqualTo(409);
        assertThat(result.message()).isEqualTo("User already exists");
    }

    @Test
    void invalidCredentialsException_returns400ErrorMessage() {
        ErrorMessage result = handler.invalidCredentialsException(new InvalidCredentialsException("Invalid email"));

        assertThat(result.status()).isEqualTo(400);
        assertThat(result.message()).isEqualTo("Invalid email");
    }
}

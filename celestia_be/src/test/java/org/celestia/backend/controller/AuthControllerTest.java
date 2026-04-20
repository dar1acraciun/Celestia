package org.celestia.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.celestia.backend.exception.InvalidCredentialsException;
import org.celestia.backend.exception.UserAlreadyExistException;
import org.celestia.backend.service.AuthService;
import org.celestia.backend.service.JwtService;
import org.celestia.generated.model.LoginRequest;
import org.celestia.generated.model.RegisterRequest;
import org.celestia.generated.model.RegisterResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = AuthController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = {
        "security.jwt.exp-time=86400000",
        "security.cookie.secure=false"
})
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthService authService;
    @MockBean JwtService jwtService;

    @Test
    void login_success_returns200AndSetsCookie() throws Exception {
        when(authService.login(any())).thenReturn("jwt-token");

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("token=jwt-token")));
    }

    @Test
    void login_invalidCredentials_returns400() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException("Invalid email"));

        LoginRequest request = new LoginRequest();
        request.setEmail("wrong@example.com");
        request.setPassword("wrong");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email"));
    }

    @Test
    void logout_returns200AndClearsCookie() throws Exception {
        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void register_success_returns200WithMessage() throws Exception {
        RegisterResponse registerResponse = new RegisterResponse();
        registerResponse.setMessage("User registered successfully");
        when(authService.register(any())).thenReturn(registerResponse);

        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully"));
    }

    @Test
    void register_emailAlreadyTaken_returns409() throws Exception {
        when(authService.register(any())).thenThrow(new UserAlreadyExistException("User already exists"));

        RegisterRequest request = new RegisterRequest();
        request.setEmail("taken@example.com");
        request.setPassword("password");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User already exists"));
    }
}
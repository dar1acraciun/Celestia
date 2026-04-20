package org.celestia.backend.service;

import org.celestia.backend.exception.InvalidCredentialsException;
import org.celestia.backend.exception.UserAlreadyExistException;
import org.celestia.backend.mapper.AuthMapper;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.UserRepository;
import org.celestia.generated.model.LoginRequest;
import org.celestia.generated.model.RegisterRequest;
import org.celestia.generated.model.RegisterResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock AuthMapper authMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;

    @InjectMocks AuthService authService;

    private User user;
    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("rawPassword");

        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("rawPassword");
    }

    @Test
    void login_success_returnsToken() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        String token = authService.login(loginRequest);

        assertThat(token).isEqualTo("jwt-token");
    }

    @Test
    void login_emailNotFound_throwsInvalidCredentials() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid email");
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid password");
    }

    @Test
    void register_success_returnsSuccessMessage() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(authMapper.toUser(registerRequest)).thenReturn(user);
        when(passwordEncoder.encode("rawPassword")).thenReturn("encodedPassword");

        RegisterResponse response = authService.register(registerRequest);

        assertThat(response.getMessage()).isEqualTo("User registered successfully");
        verify(userRepository).save(user);
    }

    @Test
    void register_encodesPasswordBeforeSaving() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(authMapper.toUser(registerRequest)).thenReturn(user);
        when(passwordEncoder.encode("rawPassword")).thenReturn("encodedPassword");

        authService.register(registerRequest);

        assertThat(user.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void register_emailAlreadyTaken_throwsUserAlreadyExist() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(UserAlreadyExistException.class)
                .hasMessage("User already exists");

        verify(userRepository, never()).save(any());
    }
}
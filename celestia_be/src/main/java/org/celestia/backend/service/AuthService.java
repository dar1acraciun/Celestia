package org.celestia.backend.service;

import org.celestia.backend.exception.InvalidCredentialsException;
import org.celestia.backend.exception.UserAlreadyExistException;
import org.celestia.backend.mapper.AuthMapper;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.UserRepository;
import org.celestia.generated.model.LoginRequest;
import org.celestia.generated.model.RegisterRequest;
import org.celestia.generated.model.RegisterResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, AuthMapper authMapper, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.authMapper = authMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String login(LoginRequest loginRequest) {
        Optional<User> user = userRepository.findByEmail(loginRequest.getEmail());
        if (user.isEmpty()) {
            throw new InvalidCredentialsException("Invalid email");
        }
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.get().getPassword())) {
            throw new InvalidCredentialsException("Invalid password");
        }
        return jwtService.generateToken(user.get());
    }

    public RegisterResponse register(RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new UserAlreadyExistException("User already exists");
        }

        User user = authMapper.toUser(registerRequest);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        userRepository.save(user);

        RegisterResponse response = new RegisterResponse();
        response.setMessage("User registered successfully");
        return response;
    }
}
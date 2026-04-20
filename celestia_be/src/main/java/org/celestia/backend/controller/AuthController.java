package org.celestia.backend.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.celestia.backend.service.AuthService;
import org.celestia.backend.service.JwtService;
import org.celestia.generated.model.LoginRequest;
import org.celestia.generated.model.RegisterRequest;
import org.celestia.generated.model.RegisterResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;

    @Value("${security.jwt.exp-time}")
    private long expTime;

    @Value("${security.cookie.secure:false}")
    private boolean secureCookie;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        String token = authService.login(loginRequest);
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, Duration.ofMillis(expTime)));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", Duration.ZERO));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest registerRequest) {
        return authService.register(registerRequest);
    }

    private String buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from("token", value)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build()
                .toString();
    }
}
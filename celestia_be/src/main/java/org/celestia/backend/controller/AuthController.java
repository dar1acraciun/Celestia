package org.celestia.backend.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.celestia.backend.service.AuthService;
import org.celestia.backend.service.CookieService;
import org.celestia.generated.model.LoginRequest;
import org.celestia.generated.model.RegisterRequest;
import org.celestia.generated.model.RegisterResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final CookieService cookieService;

    public AuthController(AuthService authService, CookieService cookieService) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        String token = authService.login(loginRequest);
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.buildAuthCookie(token));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieService.buildClearCookie());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest registerRequest) {
        return authService.register(registerRequest);
    }
}
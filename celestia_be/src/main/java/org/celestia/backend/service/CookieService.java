package org.celestia.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class CookieService {

    @Value("${security.jwt.exp-time}")
    private long expTime;

    @Value("${security.cookie.secure:false}")
    private boolean secureCookie;

    public String buildAuthCookie(String token) {
        return buildCookie(token, Duration.ofMillis(expTime));
    }

    public String buildClearCookie() {
        return buildCookie("", Duration.ZERO);
    }

    private String buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from("token", value)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .maxAge(maxAge)
                .sameSite(secureCookie ? "None" : "Lax")
                .build()
                .toString();
    }
}
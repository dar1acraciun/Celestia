package org.celestia.backend.service;

import org.celestia.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    private static final String SECRET = "c3VwZXItc2VjcmV0LWtleS1yaWdodC1oZXJlLXdoaWNoLWlzLWxvbmctZW5vdWdo";
    private static final long EXP_TIME = 86400000L;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKeyString", SECRET);
        ReflectionTestUtils.setField(jwtService, "expTime", EXP_TIME);

        user = new User();
        user.setEmail("test@example.com");
    }

    @Test
    void generateToken_returnsNonBlankToken() {
        assertThat(jwtService.generateToken(user)).isNotBlank();
    }

    @Test
    void extractEmailFromToken_returnsCorrectEmail() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.extractEmailFromToken(token)).isEqualTo("test@example.com");
    }

    @Test
    void validateToken_withCorrectUser_returnsTrue() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.validateToken(token, user)).isTrue();
    }

    @Test
    void validateToken_withDifferentUser_returnsFalse() {
        String token = jwtService.generateToken(user);

        User other = new User();
        other.setEmail("other@example.com");

        assertThat(jwtService.validateToken(token, other)).isFalse();
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(jwtService, "expTime", -1000L);
        String expiredToken = jwtService.generateToken(user);

        assertThat(jwtService.validateToken(expiredToken, user)).isFalse();
    }

    @Test
    void getClaimsFromToken_containsEmail() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.getClaimsFromToken(token).getSubject()).isEqualTo("test@example.com");
    }
}
package org.celestia.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class CookieServiceTest {

    private CookieService cookieService;

    @BeforeEach
    void setUp() {
        cookieService = new CookieService();
        ReflectionTestUtils.setField(cookieService, "expTime", 3600000L);
        ReflectionTestUtils.setField(cookieService, "secureCookie", false);
    }

    @Test
    void buildAuthCookie_containsToken() {
        String cookie = cookieService.buildAuthCookie("jwt-token");

        assertThat(cookie).contains("token=jwt-token");
    }

    @Test
    void buildAuthCookie_isHttpOnly() {
        String cookie = cookieService.buildAuthCookie("jwt-token");

        assertThat(cookie).contains("HttpOnly");
    }

    @Test
    void buildAuthCookie_hasCorrectPath() {
        String cookie = cookieService.buildAuthCookie("jwt-token");

        assertThat(cookie).contains("Path=/");
    }

    @Test
    void buildClearCookie_hasEmptyValue() {
        String cookie = cookieService.buildClearCookie();

        assertThat(cookie).contains("Max-Age=0");
        assertThat(cookie).doesNotContain("token=jwt");
    }

    @Test
    void buildClearCookie_isHttpOnly() {
        String cookie = cookieService.buildClearCookie();

        assertThat(cookie).contains("HttpOnly");
    }
}
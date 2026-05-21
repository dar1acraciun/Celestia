package org.celestia.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.celestia.backend.model.User;
import org.celestia.backend.repository.UserRepository;
import org.celestia.backend.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock JwtService jwtService;
    @Mock UserRepository userRepository;
    @Mock FilterChain filterChain;

    @InjectMocks JwtAuthFilter jwtAuthFilter;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validToken_setsAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("token", "valid-jwt"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractEmailFromToken("valid-jwt")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.validateToken("valid-jwt", user)).thenReturn(true);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isSameAs(user);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void invalidToken_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("token", "bad-jwt"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractEmailFromToken("bad-jwt")).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.validateToken("bad-jwt", user)).thenReturn(false);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void noCookie_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService, userRepository);
    }

    @Test
    void userNotFound_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("token", "valid-jwt"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractEmailFromToken("valid-jwt")).thenReturn("unknown@example.com");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
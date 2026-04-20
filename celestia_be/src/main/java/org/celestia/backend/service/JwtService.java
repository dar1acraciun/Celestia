package org.celestia.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.celestia.backend.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    @Value("${security.jwt.secret-key}")
    private String secretKeyString;

    @Value("${security.jwt.exp-time}")
    private long expTime;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKeyString);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        return Jwts.builder().subject(user.getEmail()).issuedAt(new Date()).
                expiration(new Date(System.currentTimeMillis() + expTime)).
                signWith(getSigningKey()).compact();
    }

    public String extractEmailFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public boolean validateToken(String token, User user) {
        try {
            String email = extractEmailFromToken(token);
            return email.equals(user.getEmail()) && !isTokenExpired(token);
        } catch (io.jsonwebtoken.JwtException e) {
            return false;
        }
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
    }

    private boolean isTokenExpired(String token) {
        Date exp = getClaimsFromToken(token).getExpiration();
        return exp.before(new Date());
    }



}

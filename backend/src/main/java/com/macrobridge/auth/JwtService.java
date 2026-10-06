package com.macrobridge.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final Duration expiration;

    public JwtService(JwtEncoder encoder, @Value("${jwt.expiration-hours}") long expirationHours) {
        this.encoder = encoder;
        this.expiration = Duration.ofHours(expirationHours);
    }

    /** The token's subject is the user id; the JWT filter reads it back on each request. */
    public String issue(UUID userId, String email) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("macrobridge")
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiresAt(now.plus(expiration))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}

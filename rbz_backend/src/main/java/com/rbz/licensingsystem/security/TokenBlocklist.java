package com.rbz.licensingsystem.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory blocklist of JWTs that have been explicitly invalidated via logout.
 *
 * Tokens are stored only until their natural expiry — no need to keep them
 * forever, because any token past its `exp` claim is rejected by JwtUtil.
 *
 * Trade-off: this is process-local. For a multi-instance deployment, swap the
 * implementation for a shared store (Redis, DB) without changing the calling code.
 */
@Component
public class TokenBlocklist {

    /** token → expiry epoch millis. */
    private final Map<String, Long> blocklist = new ConcurrentHashMap<>();

    public void revoke(String token, long expiryEpochMillis) {
        if (token == null || token.isBlank()) return;
        blocklist.put(token, expiryEpochMillis);
        purgeExpired();
    }

    public boolean isRevoked(String token) {
        if (token == null) return false;
        Long exp = blocklist.get(token);
        if (exp == null) return false;
        if (exp < System.currentTimeMillis()) {
            blocklist.remove(token);
            return false;
        }
        return true;
    }

    /** Best-effort cleanup; called opportunistically on every revoke. */
    private void purgeExpired() {
        long now = System.currentTimeMillis();
        blocklist.entrySet().removeIf(e -> e.getValue() < now);
    }
}

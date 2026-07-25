package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import org.apache.commons.codec.digest.DigestUtils;
import java.time.LocalDateTime;

@Entity
@Data
public class SystemActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private String actorRole;

    @Column(nullable = false, updatable = false)
    private String actorName;

    @Column(updatable = false)
    private Long companyId;

    @Column(nullable = false, updatable = false)
    private String activityType;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String detail;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String dataSnapshot;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Tamper-evidence: SHA-256 hash of this entry's content chained to previous entry
    @Column(updatable = false, length = 64)
    private String entryHash;

    @Column(updatable = false, length = 64)
    private String previousHash;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
        String content = s(actorRole) + s(actorName) + s(companyId)
                + s(activityType) + s(detail) + timestamp.toString();
        this.entryHash = DigestUtils.sha256Hex(content + s(previousHash));
    }

    @PreUpdate
    protected void onUpdate() {
        throw new UnsupportedOperationException("Audit log entries are immutable.");
    }

    @PreRemove
    protected void onRemove() {
        throw new UnsupportedOperationException("Audit log entries cannot be deleted.");
    }

    private String s(Object o) {
        return o == null ? "" : o.toString();
    }
}

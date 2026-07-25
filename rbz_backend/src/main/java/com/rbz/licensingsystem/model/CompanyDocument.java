package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class CompanyDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private String documentType;

    private String fileName;
    private String filePath;
    private String contentType;
    private long fileSize;

    private String sha256;

    @Column(length = 32)
    private String verificationStatus;

    @Column(length = 1000)
    private String aiReason;

    private Double aiConfidence;

    @Column(length = 2000)
    private String examinerComment;

    private String verifiedBy;

    private LocalDateTime verifiedAt;

    private Integer version;

    private String uploadedBy;

    private LocalDateTime uploadTimestamp;

    @PrePersist
    protected void onCreate() {
        if (uploadTimestamp == null) {
            uploadTimestamp = LocalDateTime.now();
        }
        if (verificationStatus == null) {
            verificationStatus = "PENDING";
        }
        if (version == null) {
            version = 1;
        }
    }
}

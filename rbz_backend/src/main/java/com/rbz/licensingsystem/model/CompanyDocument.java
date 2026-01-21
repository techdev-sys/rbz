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
    private String documentType; // financialStatements, businessPlan, taxClearance, etc.
    private String fileName;
    private String filePath;
    private String contentType;
    private long fileSize;

    private LocalDateTime uploadTimestamp;

    @PrePersist
    protected void onCreate() {
        uploadTimestamp = LocalDateTime.now();
    }
}

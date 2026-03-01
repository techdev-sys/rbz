package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "company_directors_registry")
public class CompanyDirectorsRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long directorId;
    private String directorName;
    private String nationalId;
    
    private String companyRegistrationNumber;
    private String companyStatus; // e.g. "ACTIVE", "DEREGISTERED"
    
    private LocalDateTime registeredAt;

    @PrePersist
    public void prePersist() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }
}

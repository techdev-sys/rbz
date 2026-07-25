package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class SanctionsEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    private String aliases; // comma-separated alternative names

    private String idNumber;

    private String nationality;

    private String listSource; // UN_CONSOLIDATED, OFAC, RBZ_INTERNAL, ZIMCODD

    private String reasonListed;

    @Column(nullable = false)
    private LocalDate dateAdded;

    private LocalDate dateRemoved; // null = still active

    private boolean active = true;
}

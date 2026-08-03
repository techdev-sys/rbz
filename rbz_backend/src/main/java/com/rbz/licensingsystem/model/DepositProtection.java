package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage: Deposit Protection (DTMFI only).
 * Captures DIPF registration status, deposit liabilities, and liquidity buffer.
 * DIPF = Deposit Insurance and Protection Fund (Zimbabwe).
 */
@Entity
@Data
public class DepositProtection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // DIPF Registration
    private String dipfRegistrationStatus; // REGISTERED | PENDING | NOT_APPLICABLE | NOT_REGISTERED
    private String dipfRegistrationNumber;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dipfRegistrationDate;

    // Deposit liabilities
    private BigDecimal totalDepositLiabilities;        // Total deposits held (USD)
    private BigDecimal maximumInsuredDepositPerDepositor; // Currently USD 500 per DIPF Act
    private Boolean depositInsurancePremiumPaid;
    private BigDecimal premiumAmount;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate premiumPaymentDate;
    private String premiumPaymentReceiptNumber;

    // Liquidity buffer
    private BigDecimal liquidAssets;                   // USD — cash + near-cash held
    private BigDecimal liquidityBufferRatio;            // liquidAssets / totalDeposits * 100; must be ≥ 10%

    // Deposit run-off protocol
    @Column(columnDefinition = "TEXT")
    private String depositRunoffProtocol;              // How the institution would manage a sudden withdrawal

    @Column(columnDefinition = "TEXT")
    private String depositorProtectionNarrative;       // Additional notes

    private String stageStatus = "PENDING";
}

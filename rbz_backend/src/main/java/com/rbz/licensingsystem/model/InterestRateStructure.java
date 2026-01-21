package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Interest Rates and Charges Structure (Table 6 in Report)
 * Stores detailed pricing for each loan product category
 */
@Entity
@Data
@Table(name = "interest_rate_structure")
public class InterestRateStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // Loan Category
    private String loanCategory; // e.g., "Individual Loans", "MSME Working Capital"

    // Interest Rates
    private BigDecimal monthlyInterestRate; // Monthly interest rate (%)
    private BigDecimal annualInterestRate; // Annual interest rate (%)

    // Fees and Charges
    private BigDecimal applicationFee; // Flat application fee
    private BigDecimal administrativeFeePercentage; // Admin fee as % of loan
    private BigDecimal insuranceFeePercentage; // Insurance as % of loan
    private BigDecimal latePaymentPenaltyPercentage; // Late payment penalty %
    private BigDecimal processingFeePercentage; // Processing fee %

    // Additional Charges
    private BigDecimal earlyRepaymentPenalty; // Penalty for early repayment
    private BigDecimal otherCharges; // Any other miscellaneous charges

    @Column(columnDefinition = "TEXT")
    private String chargesDescription; // Description of all charges

    // Comparison with Industry
    @Column(columnDefinition = "TEXT")
    private String industryComparison; // How rates compare to industry average

    private String compliantWithRBZGuidelines; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String pricingJustification; // Justification for pricing structure
}

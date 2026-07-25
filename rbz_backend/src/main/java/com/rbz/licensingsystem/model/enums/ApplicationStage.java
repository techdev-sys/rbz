package com.rbz.licensingsystem.model.enums;

public enum ApplicationStage {
    COMPANY_PROFILE,
    LEGAL_OWNERSHIP_VALIDATION,
    DIRECTOR_VALIDATION,
    BOARD_COMMITTEES,
    CAPITAL_VALIDATION,
    BUSINESS_PLAN_REVIEW,
    FINANCIAL_PROJECTIONS,
    GROWTH_AND_DEVELOPMENT,
    DOCUMENT_INTAKE,
    DEPOSIT_PROTECTION,   // DTMFI only — DIPF registration & liquidity buffer
    CAPITAL_ADEQUACY,     // Commercial Bank only — Basel III Tier 1/2 capital
    LIQUIDITY_MANAGEMENT, // Commercial Bank only — LCR/NSFR (Basel III)
    IT_CYBER_RISK,        // Commercial Bank only — IT governance & cyber security
    RECOVERY_RESOLUTION,  // Commercial Bank only — Recovery & Resolution Plan
    FINAL_RECOMMENDATION
}

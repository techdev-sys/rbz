package com.rbz.licensingsystem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class VerificationResultDTO {

    @JsonProperty("valid")
    private boolean valid;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("detected_name")
    private String detectedName;

    // Getters and Setters
    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDetectedName() { return detectedName; }
    public void setDetectedName(String detectedName) { this.detectedName = detectedName; }
}
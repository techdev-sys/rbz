package com.rbz.licensingsystem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class CR11ResultDTO {
    
    @JsonProperty("shareholders")
    private List<ShareholderExtractionDTO> shareholders;
    
    @JsonProperty("capital_summary")
    private CapitalSummaryDTO capitalSummary;
    
    @JsonProperty("verification_status")
    private String verificationStatus;

    @Data
    public static class ShareholderExtractionDTO {
        private String name;
        
        @JsonProperty("shares_count")
        private Integer sharesCount;
        
        private String address;
    }

    @Data
    public static class CapitalSummaryDTO {
        @JsonProperty("nominal_capital")
        private String nominalCapital;
        
        private String currency;
    }
}

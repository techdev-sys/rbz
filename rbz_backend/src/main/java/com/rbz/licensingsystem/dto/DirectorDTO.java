package com.rbz.licensingsystem.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DirectorDTO {

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("date_of_birth")
    private String dateOfBirth;

    @JsonProperty("nationality")
    private String nationality;

    @JsonProperty("id_number")
    private String idNumber;

    // === CHANGED TO BOOLEAN ===
    // Jackson will automatically convert "True"/"False" strings from Python into boolean true/false
    @JsonProperty("risk_flag")
    private boolean riskFlag; 

    @JsonProperty("qualifications")
    private String qualifications;

    @JsonProperty("experience_summary")
    private String experience;

    // --- Getters and Setters ---

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getIdNumber() { return idNumber; }
    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }

    // === THE FIX: BOOLEAN GETTER ===
    // This is the method your Controller is looking for!
    public boolean isRiskFlag() { return riskFlag; }
    public void setRiskFlag(boolean riskFlag) { this.riskFlag = riskFlag; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    
    // Helper for consistency
    public String getExperienceSummary() { return experience; }
}
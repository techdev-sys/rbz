package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.dto.DirectorDTO;
import com.rbz.licensingsystem.dto.VerificationResultDTO; // Make sure you have this DTO
import com.rbz.licensingsystem.dto.CR11ResultDTO; // Make sure you have this DTO
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class AIService {

    private final RestTemplate restTemplate;

    @Autowired
    public AIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // 1. Extract Info from CV (Director Vetting)
    public DirectorDTO extractDirectorInfo(MultipartFile file) throws IOException {
        String url = "http://localhost:8000/analyze-document";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<DirectorDTO> response = restTemplate.postForEntity(url, requestEntity, DirectorDTO.class);

        return response.getBody();
    }

    // 2. Verify Generic Documents (Police, Tax, Affidavit)
    public ResponseEntity<?> verifyDocument(MultipartFile file, String docType, String directorName) {
        try {
            String url = "http://localhost:8000/verify-document";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", resource);
            body.add("doc_type", docType);
            body.add("director_name", directorName);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // CHANGED: Uses postForEntity to match the return type 'ResponseEntity'
            return restTemplate.postForEntity(url, requestEntity, VerificationResultDTO.class);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error processing file: " + e.getMessage());
        }
    }

    // 3. Extract CR11 (Shareholding)
    public CR11ResultDTO extractCR11(MultipartFile file) throws IOException {
        String url = "http://localhost:8000/verify-document";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", resource);
        body.add("doc_type", "cr11_form");
        body.add("director_name", "N/A");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(url, requestEntity, CR11ResultDTO.class);
    }

    // 4. === NEW METHOD: Verify Company Documents (Certificate of Incorporation)
    // ===
    public ResponseEntity<?> verifyCompanyDocument(MultipartFile file, String docType, Long companyId) {
        try {
            String url = "http://localhost:8000/verify-document";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", resource);
            body.add("doc_type", docType);
            body.add("director_name", "Company Document");

            // We pass the company ID if needed, or just for tracking
            if (companyId != null) {
                body.add("company_id", companyId);
            }

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // We return a String (raw JSON) here to be flexible, or you can map it to a DTO
            return restTemplate.postForEntity(url, requestEntity, String.class);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error processing company document: " + e.getMessage());
        }
    }
}
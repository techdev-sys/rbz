package com.rbz.licensingsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        // Configure with longer timeouts for AI processing
        org.springframework.boot.web.client.RestTemplateBuilder builder = new org.springframework.boot.web.client.RestTemplateBuilder();

        return builder
                .setConnectTimeout(java.time.Duration.ofSeconds(30)) // Connection timeout
                .setReadTimeout(java.time.Duration.ofSeconds(60)) // Read timeout (AI takes time)
                .build();
    }
}

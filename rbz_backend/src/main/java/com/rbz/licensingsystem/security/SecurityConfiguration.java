package com.rbz.licensingsystem.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOriginsConfig;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                // Use our explicit CORS configuration source
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        // Senior BE-only: examiner management, report approval, application assignment
                        .requestMatchers("/api/examiners/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/approve/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/review/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/recommend/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/director-sign/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/governor-sign/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/pending-review").hasRole("SENIOR_BE")
                        .requestMatchers("/api/report/by-status/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/company/*/assign").hasRole("SENIOR_BE")
                        .requestMatchers("/api/company/*/generate-license-code").hasRole("SENIOR_BE")
                        // Examiner + Senior BE: workflow evaluation, report generation/submission
                        .requestMatchers("/api/workflow/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers("/api/report/generate/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers("/api/report/submit/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers(HttpMethod.GET, "/api/report/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        // Applicants may read stage reviews (examiner feedback); only EXAMINER/SENIOR_BE may write
                        .requestMatchers(HttpMethod.GET, "/api/review/**").authenticated()
                        .requestMatchers("/api/review/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        // Risk scoring: examiners calculate, all authenticated users can read
                        .requestMatchers(HttpMethod.GET, "/api/risk/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers("/api/risk/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        // AML screening: examiners and senior can screen; only senior can manage the list
                        .requestMatchers("/api/aml/sanctions").hasRole("SENIOR_BE")
                        .requestMatchers(HttpMethod.DELETE, "/api/aml/sanctions/**").hasRole("SENIOR_BE")
                        .requestMatchers("/api/aml/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        // License lifecycle: senior only for renewal actions; both can view dashboard
                        .requestMatchers(HttpMethod.GET, "/api/license-lifecycle/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers("/api/license-lifecycle/**").hasRole("SENIOR_BE")
                        // Audit log: senior only for integrity check; both can read logs
                        .requestMatchers(HttpMethod.GET, "/api/audit/logs").hasAnyRole("EXAMINER", "SENIOR_BE")
                        .requestMatchers("/api/audit/**").hasRole("SENIOR_BE")
                        // External verification: examiners and senior
                        .requestMatchers("/api/external-verify/**").hasAnyRole("EXAMINER", "SENIOR_BE")
                        // Everything else requires any authenticated user
                        .anyRequest().authenticated())

                // Stateless session
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Insert our Jwt Filter before standard UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOriginsConfig.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

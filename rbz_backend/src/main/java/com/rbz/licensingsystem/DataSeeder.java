package com.rbz.licensingsystem;

import com.rbz.licensingsystem.model.Examiner;
import com.rbz.licensingsystem.repository.ExaminerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final ExaminerRepository examinerRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_SENIOR_USERNAME  = "s.mashonganyika@rbz.co.zw";
    private static final String DEFAULT_SENIOR_PASSWORD  = "Password123";
    private static final String DEFAULT_SENIOR_FULL_NAME = "S. Mashonganyika";
    private static final String DEFAULT_SENIOR_EMPLOYEE_ID = "DD-2026-001";

    @Override
    public void run(ApplicationArguments args) {
        seedSeniorExaminer();
    }

    private void seedSeniorExaminer() {
        boolean exists = examinerRepository.findByUsername(DEFAULT_SENIOR_USERNAME).isPresent();
        if (exists) {
            return;
        }

        Examiner senior = new Examiner();
        senior.setEmployeeId(DEFAULT_SENIOR_EMPLOYEE_ID);
        senior.setFullName(DEFAULT_SENIOR_FULL_NAME);
        senior.setUsername(DEFAULT_SENIOR_USERNAME);
        senior.setPassword(passwordEncoder.encode(DEFAULT_SENIOR_PASSWORD));
        senior.setRole("SENIOR_BE");
        senior.setDesignation("Deputy Director - Bank Supervision");
        senior.setEmail(DEFAULT_SENIOR_USERNAME);
        senior.setStatus("ACTIVE");
        senior.setCreatedBy("SYSTEM");
        examinerRepository.save(senior);

        log.info("=================================================================");
        log.info("  DEFAULT SENIOR EXAMINER ACCOUNT CREATED");
        log.info("  Username : {}", DEFAULT_SENIOR_USERNAME);
        log.info("  Password : {}", DEFAULT_SENIOR_PASSWORD);
        log.info("  Role     : SENIOR_BE");
        log.info("  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION");
        log.info("=================================================================");
    }
}

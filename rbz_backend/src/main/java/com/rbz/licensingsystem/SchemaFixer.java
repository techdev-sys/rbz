package com.rbz.licensingsystem;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class SchemaFixer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== STARTING SCHEMA FIX ======");
        try {
            // Attempt to alter the column type
            String sql = "ALTER TABLE director ALTER COLUMN risk_flag TYPE boolean USING risk_flag::boolean";
            jdbcTemplate.execute(sql);
            System.out.println("====== SCHEMA FIX SUCCESS: Director table updated. ======");
        } catch (Exception e) {
            System.out.println("====== SCHEMA FIX INFO: " + e.getMessage() + " ======");
        }
    }
}

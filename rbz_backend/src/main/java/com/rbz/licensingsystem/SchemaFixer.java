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
            String[] newCols = {
                "affidavit_verified",
                "net_worth_verified",
                "police_clearance_verified",
                "tax_clearance_verified",
                "certified_id_verified"
            };
            for (String col : newCols) {
                try {
                    jdbcTemplate.execute("ALTER TABLE director ADD COLUMN " + col + " boolean DEFAULT false");
                    System.out.println("====== SCHEMA FIX: Added column " + col + " ======");
                } catch (Exception e) {
                    // Column might already exist, ignore
                }
            }

            // Attempt to alter the column type
            String sql = "ALTER TABLE director ALTER COLUMN risk_flag TYPE boolean USING risk_flag::boolean";
            jdbcTemplate.execute(sql);
            System.out.println("====== SCHEMA FIX SUCCESS: Director table updated. ======");
        } catch (Exception e) {
            System.out.println("====== SCHEMA FIX INFO: " + e.getMessage() + " ======");
        }
    }
}

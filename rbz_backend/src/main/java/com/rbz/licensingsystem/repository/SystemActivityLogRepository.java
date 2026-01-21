package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.SystemActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemActivityLogRepository extends JpaRepository<SystemActivityLog, Long> {
    List<SystemActivityLog> findByCompanyId(Long companyId);
}

package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.ComplaintsHandling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplaintsHandlingRepository extends JpaRepository<ComplaintsHandling, Long> {
    Optional<ComplaintsHandling> findByCompanyId(Long companyId);
}

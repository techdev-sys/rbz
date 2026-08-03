package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CapitalAdequacyReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CapitalAdequacyReturnRepository extends JpaRepository<CapitalAdequacyReturn, Long> {
    Optional<CapitalAdequacyReturn> findByCompanyId(Long companyId);
}

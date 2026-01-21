package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.Shareholder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShareholderRepository extends JpaRepository<Shareholder, Long> {
    List<Shareholder> findByCompanyId(Long companyId);
}

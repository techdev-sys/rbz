package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.Director;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DirectorRepository extends JpaRepository<Director, Long> {
    // This allows us to find all directors belonging to one company
    List<Director> findByCompanyId(Long companyId);
}
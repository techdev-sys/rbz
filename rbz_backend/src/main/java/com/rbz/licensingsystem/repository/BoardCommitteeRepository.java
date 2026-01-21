package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.BoardCommittee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardCommitteeRepository extends JpaRepository<BoardCommittee, Long> {
    List<BoardCommittee> findByCompanyId(Long companyId);
}

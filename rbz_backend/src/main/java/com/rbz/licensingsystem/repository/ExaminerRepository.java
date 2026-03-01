package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.Examiner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExaminerRepository extends JpaRepository<Examiner, Long> {

    Optional<Examiner> findByUsername(String username);

    Optional<Examiner> findByEmployeeId(String employeeId);

    List<Examiner> findByStatus(String status);

    List<Examiner> findByRole(String role);

    boolean existsByUsername(String username);

    boolean existsByEmployeeId(String employeeId);
}

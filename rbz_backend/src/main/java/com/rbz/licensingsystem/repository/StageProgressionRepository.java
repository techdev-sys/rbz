package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.StageProgression;
import com.rbz.licensingsystem.model.enums.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StageProgressionRepository extends JpaRepository<StageProgression, Long> {
    Optional<StageProgression> findByCompanyIdAndStage(Long companyId, ApplicationStage stage);
    List<StageProgression> findByCompanyIdOrderByCompletedAtDesc(Long companyId);
}

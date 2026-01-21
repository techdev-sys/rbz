package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.StageReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StageReviewRepository extends JpaRepository<StageReview, Long> {
    List<StageReview> findByCompanyId(Long companyId);

    Optional<StageReview> findByCompanyIdAndStageId(Long companyId, Integer stageId);
}

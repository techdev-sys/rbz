package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.StageReview;
import com.rbz.licensingsystem.repository.StageReviewRepository;
import com.rbz.licensingsystem.service.LearningService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/review")
@Slf4j
public class ReviewController {

    @Autowired
    private StageReviewRepository reviewRepository;

    @Autowired
    private LearningService learningService;

    @GetMapping("/{companyId}")
    public List<StageReview> getReviews(@PathVariable Long companyId) {
        return reviewRepository.findByCompanyId(companyId);
    }

    @PostMapping("/save")
    public ResponseEntity<StageReview> saveReview(@RequestBody StageReview review) {
        try {
            // Check if exists, update logic if needed, or just save (overwrite/update)
            Optional<StageReview> existing = reviewRepository.findByCompanyIdAndStageId(review.getCompanyId(),
                    review.getStageId());
            if (existing.isPresent()) {
                StageReview dbReview = existing.get();
                dbReview.setStatus(review.getStatus());
                dbReview.setExaminerComment(review.getExaminerComment());
                dbReview.setExaminerName(review.getExaminerName());
                review = dbReview; // Save the updated entity
            }

            StageReview saved = reviewRepository.save(review);

            // AI LEARNING: Capture the examiner's decision
            learningService.captureEvent(
                    "EXAMINER",
                    review.getExaminerName(),
                    review.getCompanyId(),
                    "STAGE_REVIEW",
                    "Stage " + review.getStageName() + " marked as " + review.getStatus(),
                    "Comment: " + review.getExaminerComment());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error saving review", e);
            return ResponseEntity.badRequest().build();
        }
    }
}

package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CommitteeMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CommitteeMember entity
 * Supports Stage 4: Board Committee Management
 */
@Repository
public interface CommitteeMemberRepository extends JpaRepository<CommitteeMember, Long> {

    List<CommitteeMember> findByCommitteeId(Long committeeId);

    List<CommitteeMember> findByDirectorId(Long directorId);

    Optional<CommitteeMember> findByCommitteeIdAndIsChairpersonTrue(Long committeeId);

    List<CommitteeMember> findByCommitteeIdAndStatus(Long committeeId, String status);

    void deleteByCommitteeIdAndDirectorId(Long committeeId, Long directorId);
}

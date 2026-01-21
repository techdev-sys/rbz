package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.BoardCommittee;
import com.rbz.licensingsystem.model.CommitteeMember;
import com.rbz.licensingsystem.repository.BoardCommitteeRepository;
import com.rbz.licensingsystem.repository.CommitteeMemberRepository;
import com.rbz.licensingsystem.repository.DirectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Board Committee Management
 * Supports Stage 4: Board Committees
 */
@RestController
@RequestMapping("/api/board-committee")
public class BoardCommitteeController {

    @Autowired
    private BoardCommitteeRepository committeeRepository;

    @Autowired
    private CommitteeMemberRepository memberRepository;

    @Autowired
    private DirectorRepository directorRepository;

    private static final String UPLOAD_DIR = "uploads/committee-documents/";

    /**
     * Get all committees for a company
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<BoardCommittee>> getCompanyCommittees(@PathVariable Long companyId) {
        List<BoardCommittee> committees = committeeRepository.findByCompanyId(companyId);
        return ResponseEntity.ok(committees);
    }

    /**
     * Create a new board committee
     */
    @PostMapping("/{companyId}/create")
    public ResponseEntity<BoardCommittee> createCommittee(
            @PathVariable Long companyId,
            @RequestBody BoardCommittee committee) {

        committee.setCompanyId(companyId);
        committee.setCommitteeFormedDate(LocalDate.now());
        BoardCommittee saved = committeeRepository.save(committee);
        return ResponseEntity.ok(saved);
    }

    /**
     * Add a member to a committee
     */
    @PostMapping("/{committeeId}/add-member")
    public ResponseEntity<CommitteeMember> addMember(
            @PathVariable Long committeeId,
            @RequestBody CommitteeMember member) {

        member.setCommitteeId(committeeId);
        member.setDateAppointed(LocalDate.now());
        member.setStatus("ACTIVE");
        CommitteeMember saved = memberRepository.save(member);
        return ResponseEntity.ok(saved);
    }

    /**
     * Set chairperson for a committee
     */
    @PutMapping("/{committeeId}/set-chairperson/{directorId}")
    public ResponseEntity<BoardCommittee> setChairperson(
            @PathVariable Long committeeId,
            @PathVariable Long directorId,
            @RequestParam String chairpersonName) {

        BoardCommittee committee = committeeRepository.findById(committeeId)
                .orElseThrow(() -> new RuntimeException("Committee not found"));

        // Clear existing chairperson
        List<CommitteeMember> members = memberRepository.findByCommitteeId(committeeId);
        members.forEach(member -> {
            member.setIsChairperson(false);
            memberRepository.save(member);
        });

        // Set new chairperson
        CommitteeMember chairperson = members.stream()
                .filter(m -> m.getDirectorId().equals(directorId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Member not found in committee"));

        chairperson.setIsChairperson(true);
        memberRepository.save(chairperson);

        // Update committee
        committee.setChairpersonId(directorId);
        committee.setChairpersonName(chairpersonName);
        BoardCommittee updated = committeeRepository.save(committee);

        return ResponseEntity.ok(updated);
    }

    /**
     * Upload Terms of Reference document
     */
    @PostMapping("/{committeeId}/upload-tor")
    public ResponseEntity<BoardCommittee> uploadTermsOfReference(
            @PathVariable Long committeeId,
            @RequestParam("file") MultipartFile file) throws IOException {

        BoardCommittee committee = committeeRepository.findById(committeeId)
                .orElseThrow(() -> new RuntimeException("Committee not found"));

        // Create upload directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // Save file with unique name
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        // Update committee
        committee.setTermsOfReferenceDocumentPath(filePath.toString());
        committee.setTorUploadDate(LocalDate.now());
        BoardCommittee updated = committeeRepository.save(committee);

        return ResponseEntity.ok(updated);
    }

    /**
     * Get all members of a committee
     */
    @GetMapping("/{committeeId}/members")
    public ResponseEntity<List<CommitteeMember>> getCommitteeMembers(@PathVariable Long committeeId) {
        List<CommitteeMember> members = memberRepository.findByCommitteeId(committeeId);
        return ResponseEntity.ok(members);
    }

    /**
     * Get chairperson of a committee
     */
    @GetMapping("/{committeeId}/chairperson")
    public ResponseEntity<CommitteeMember> getChairperson(@PathVariable Long committeeId) {
        CommitteeMember chairperson = memberRepository.findByCommitteeIdAndIsChairpersonTrue(committeeId)
                .orElse(null);
        return ResponseEntity.ok(chairperson);
    }

    /**
     * Remove a member from a committee
     */
    @DeleteMapping("/{committeeId}/remove-member/{directorId}")
    public ResponseEntity<String> removeMember(
            @PathVariable Long committeeId,
            @PathVariable Long directorId) {

        memberRepository.deleteByCommitteeIdAndDirectorId(committeeId, directorId);
        return ResponseEntity.ok("Member removed successfully");
    }

    /**
     * Delete a committee
     */
    @DeleteMapping("/{committeeId}")
    public ResponseEntity<String> deleteCommittee(@PathVariable Long committeeId) {
        // Delete all members first
        List<CommitteeMember> members = memberRepository.findByCommitteeId(committeeId);
        memberRepository.deleteAll(members);

        // Delete committee
        committeeRepository.deleteById(committeeId);
        return ResponseEntity.ok("Committee deleted successfully");
    }
}

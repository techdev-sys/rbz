package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.SanctionsEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SanctionsEntryRepository extends JpaRepository<SanctionsEntry, Long> {

    List<SanctionsEntry> findByActiveTrue();

    @Query("SELECT s FROM SanctionsEntry s WHERE s.active = true AND " +
           "(LOWER(s.fullName) LIKE LOWER(CONCAT('%', :name, '%')) OR " +
           " LOWER(s.aliases) LIKE LOWER(CONCAT('%', :name, '%')))")
    List<SanctionsEntry> searchByName(@Param("name") String name);

    @Query("SELECT s FROM SanctionsEntry s WHERE s.active = true AND " +
           "s.idNumber IS NOT NULL AND LOWER(s.idNumber) = LOWER(:idNumber)")
    List<SanctionsEntry> findByIdNumber(@Param("idNumber") String idNumber);
}

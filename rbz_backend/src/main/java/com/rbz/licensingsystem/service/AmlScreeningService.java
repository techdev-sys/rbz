package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.Director;
import com.rbz.licensingsystem.model.SanctionsEntry;
import com.rbz.licensingsystem.model.Shareholder;
import com.rbz.licensingsystem.repository.DirectorRepository;
import com.rbz.licensingsystem.repository.SanctionsEntryRepository;
import com.rbz.licensingsystem.repository.ShareholderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmlScreeningService {

    private final SanctionsEntryRepository sanctionsRepository;
    private final DirectorRepository directorRepository;
    private final ShareholderRepository shareholderRepository;

    /**
     * Screen all directors and shareholders of a company against the sanctions list.
     * Returns a map with overall result and per-person matches.
     */
    @Transactional
    public Map<String, Object> screenCompany(Long companyId) {
        List<Map<String, Object>> hits = new ArrayList<>();

        for (Director d : directorRepository.findByCompanyId(companyId)) {
            List<Map<String, Object>> matches = screenName(d.getFullName(), d.getIdNumber());
            if (!matches.isEmpty()) {
                d.setRiskFlag(true);
                directorRepository.save(d);
                Map<String, Object> hit = new LinkedHashMap<>();
                hit.put("type", "DIRECTOR");
                hit.put("name", d.getFullName());
                hit.put("idNumber", d.getIdNumber());
                hit.put("matches", matches);
                hits.add(hit);
                log.warn("AML HIT — director {} (company {})", d.getFullName(), companyId);
            }
        }

        for (Shareholder s : shareholderRepository.findByCompanyId(companyId)) {
            List<Map<String, Object>> matches = screenName(s.getFullName(), null);
            if (!matches.isEmpty()) {
                s.setUnSanctionsListScreened("YES");
                s.setScreeningDate(LocalDate.now());
                shareholderRepository.save(s);
                Map<String, Object> hit = new LinkedHashMap<>();
                hit.put("type", "SHAREHOLDER");
                hit.put("name", s.getFullName());
                hit.put("matches", matches);
                hits.add(hit);
                log.warn("AML HIT — shareholder {} (company {})", s.getFullName(), companyId);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("companyId", companyId);
        result.put("screenedAt", LocalDate.now().toString());
        result.put("hitsFound", hits.size());
        result.put("clearStatus", hits.isEmpty() ? "CLEAR" : "FLAGGED");
        result.put("hits", hits);
        return result;
    }

    /**
     * Screen a single name + optional ID against the sanctions list.
     * Uses fuzzy token matching (all words must appear in entry name or aliases).
     */
    public List<Map<String, Object>> screenName(String fullName, String idNumber) {
        List<Map<String, Object>> matches = new ArrayList<>();
        if (fullName == null || fullName.isBlank()) return matches;

        // ID number exact match
        if (idNumber != null && !idNumber.isBlank()) {
            sanctionsRepository.findByIdNumber(idNumber).forEach(entry -> {
                matches.add(toMatchMap(entry, "ID_MATCH", 100));
            });
        }

        // Name token match: every word in the query must appear in the entry's name/aliases
        String[] queryTokens = fullName.trim().toLowerCase().split("\\s+");
        for (SanctionsEntry entry : sanctionsRepository.findByActiveTrue()) {
            String entryText = (entry.getFullName() + " " + (entry.getAliases() != null ? entry.getAliases() : "")).toLowerCase();
            int matched = 0;
            for (String token : queryTokens) {
                if (token.length() >= 3 && entryText.contains(token)) matched++;
            }
            int score = queryTokens.length > 0 ? (matched * 100 / queryTokens.length) : 0;
            // Require at least 75% token match to flag
            if (score >= 75) {
                boolean alreadyById = matches.stream()
                        .anyMatch(m -> m.get("entryId").equals(entry.getId()));
                if (!alreadyById) {
                    matches.add(toMatchMap(entry, "NAME_MATCH", score));
                }
            }
        }
        return matches;
    }

    private Map<String, Object> toMatchMap(SanctionsEntry entry, String matchType, int confidence) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("entryId", entry.getId());
        m.put("sanctionedName", entry.getFullName());
        m.put("listSource", entry.getListSource());
        m.put("reason", entry.getReasonListed());
        m.put("matchType", matchType);
        m.put("confidence", confidence);
        return m;
    }
}

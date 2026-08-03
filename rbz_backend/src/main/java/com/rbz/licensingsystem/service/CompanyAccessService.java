package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Authorisation helpers for company-scoped resources.
 *
 * Examiners and Senior BEs may access any company. Applicants may only access
 * their own company (looked up via the JWT principal's email matching the
 * CompanyProfile.emailAddress).
 */
@Service
@RequiredArgsConstructor
public class CompanyAccessService {

    private final CompanyProfileRepository companyProfileRepository;

    /**
     * Throws AccessDeniedException if the current authenticated user is not
     * permitted to read or modify resources for the given companyId.
     */
    public void assertCanAccessCompany(Long companyId) {
        if (companyId == null) {
            throw new AccessDeniedException("companyId is required");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Not authenticated");
        }

        if (hasStaffRole(auth)) {
            return; // examiners and senior BE can access any company
        }

        // Applicant: must own the company (email match)
        String principal = auth.getName();
        List<CompanyProfile> ownProfiles = companyProfileRepository.findAllByEmailAddress(principal);
        boolean hasAccess = ownProfiles.stream().anyMatch(p -> companyId.equals(p.getId()));
        if (!hasAccess) {
            throw new AccessDeniedException("You do not have access to this company.");
        }
    }

    public boolean isStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && hasStaffRole(auth);
    }

    public String currentPrincipalName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }

    private boolean hasStaffRole(Authentication auth) {
        for (GrantedAuthority ga : auth.getAuthorities()) {
            String r = ga.getAuthority();
            if ("ROLE_EXAMINER".equals(r)
                    || "ROLE_SENIOR_BE".equals(r)
                    || "ROLE_SENIOR_EXAMINER".equals(r)) {
                return true;
            }
        }
        return false;
    }
}

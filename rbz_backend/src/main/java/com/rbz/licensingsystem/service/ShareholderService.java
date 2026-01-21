package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.Shareholder;
import com.rbz.licensingsystem.repository.ShareholderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShareholderService {

    private final ShareholderRepository shareholderRepository;

    @Autowired
    public ShareholderService(ShareholderRepository shareholderRepository) {
        this.shareholderRepository = shareholderRepository;
    }

    public Shareholder saveShareholder(@NonNull Shareholder shareholder) {
        return shareholderRepository.save(shareholder);
    }

    public List<Shareholder> getShareholdersByCompanyId(@NonNull Long companyId) {
        return shareholderRepository.findByCompanyId(companyId);
    }

    public List<Shareholder> saveAll(@NonNull List<Shareholder> shareholders) {
        return shareholderRepository.saveAll(shareholders);
    }
}

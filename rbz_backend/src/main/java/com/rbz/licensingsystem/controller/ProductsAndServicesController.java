package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.ProductsAndServices;
import com.rbz.licensingsystem.repository.ProductsAndServicesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products-services")
@RequiredArgsConstructor
public class ProductsAndServicesController {

    private final ProductsAndServicesRepository repository;

    @PostMapping("/save")
    public ResponseEntity<ProductsAndServices> save(@RequestBody ProductsAndServices data) {
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId()).ifPresent(existing -> data.setId(existing.getId()));
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ProductsAndServices> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

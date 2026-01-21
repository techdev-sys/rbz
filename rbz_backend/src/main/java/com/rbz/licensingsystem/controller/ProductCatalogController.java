package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProduct;
import com.rbz.licensingsystem.model.MicrofinanceProduct;
import com.rbz.licensingsystem.service.ProductCatalogService;
import com.rbz.licensingsystem.service.LearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Product Catalog Management
 * Supports Stage 5: Product Selection
 */
@RestController
@RequestMapping("/api/products")
public class ProductCatalogController {

    @Autowired
    private ProductCatalogService productCatalogService;

    @Autowired
    private LearningService learningService;

    /**
     * Get all available products in the catalog
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<MicrofinanceProduct>> getAllProducts() {
        List<MicrofinanceProduct> products = productCatalogService.getAllAvailableProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Search products by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<MicrofinanceProduct>> searchProducts(@RequestParam String q) {
        List<MicrofinanceProduct> products = productCatalogService.searchProducts(q);
        return ResponseEntity.ok(products);
    }

    /**
     * Get products by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<MicrofinanceProduct>> getProductsByCategory(@PathVariable String category) {
        List<MicrofinanceProduct> products = productCatalogService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    /**
     * Get all products selected by a company
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<CompanyProduct>> getCompanyProducts(@PathVariable Long companyId) {
        List<CompanyProduct> products = productCatalogService.getCompanyProducts(companyId);
        return ResponseEntity.ok(products);
    }

    /**
     * Get count of products offered by a company
     */
    @GetMapping("/company/{companyId}/count")
    public ResponseEntity<Long> getCompanyProductCount(@PathVariable Long companyId) {
        Long count = productCatalogService.getCompanyProductCount(companyId);
        return ResponseEntity.ok(count);
    }

    /**
     * Add a product to company's offering
     */
    @PostMapping("/company/{companyId}/add")
    public ResponseEntity<CompanyProduct> addProductToCompany(
            @PathVariable Long companyId,
            @RequestBody CompanyProduct companyProduct) {

        companyProduct.setCompanyId(companyId);
        CompanyProduct saved = productCatalogService.addProductToCompany(companyProduct);

        learningService.captureEvent("APPLICANT", "APPLICANT", companyId,
                "PRODUCT_ADD", "Added catalog product ID: " + saved.getProductId(), saved.toString());

        return ResponseEntity.ok(saved);
    }

    /**
     * Add a custom product for a company
     */
    @PostMapping("/company/{companyId}/add-custom")
    public ResponseEntity<CompanyProduct> addCustomProduct(
            @PathVariable Long companyId,
            @RequestBody CompanyProduct companyProduct) {

        companyProduct.setCompanyId(companyId);
        CompanyProduct saved = productCatalogService.addCustomProduct(companyProduct);

        learningService.captureEvent("APPLICANT", "APPLICANT", companyId,
                "PRODUCT_ADD_CUSTOM", "Added custom product: " + saved.getCustomProductName(), saved.toString());

        return ResponseEntity.ok(saved);
    }

    /**
     * Update company product details
     */
    @PutMapping("/company-product/{companyProductId}")
    public ResponseEntity<CompanyProduct> updateCompanyProduct(
            @PathVariable Long companyProductId,
            @RequestBody CompanyProduct companyProduct) {

        CompanyProduct updated = productCatalogService.updateCompanyProduct(companyProductId, companyProduct);

        learningService.captureEvent("APPLICANT", "APPLICANT", updated.getCompanyId(),
                "PRODUCT_UPDATE", "Updated details for product ID: " + updated.getProductId(), updated.toString());

        return ResponseEntity.ok(updated);
    }

    /**
     * Remove a product from company's offering
     */
    @DeleteMapping("/company/{companyId}/remove/{productId}")
    public ResponseEntity<String> removeProduct(
            @PathVariable Long companyId,
            @PathVariable Long productId) {

        productCatalogService.removeProductFromCompany(companyId, productId);

        learningService.captureEvent("APPLICANT", "APPLICANT", companyId,
                "PRODUCT_REMOVE", "Removed product ID: " + productId, "");

        return ResponseEntity.ok("Product removed successfully");
    }

    /**
     * Initialize the product catalog (admin endpoint)
     */
    @PostMapping("/initialize-catalog")
    public ResponseEntity<String> initializeCatalog() {
        productCatalogService.initializeProductCatalog();
        return ResponseEntity.ok("Product catalog initialized successfully");
    }
}

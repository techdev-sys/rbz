package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.CompanyProduct;
import com.rbz.licensingsystem.model.MicrofinanceProduct;
import com.rbz.licensingsystem.repository.CompanyProductRepository;
import com.rbz.licensingsystem.repository.MicrofinanceProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing product catalog and company product selections
 * Supports Stage 5: Products and Services
 */
@Service
@Transactional
public class ProductCatalogService {

    @Autowired
    private MicrofinanceProductRepository productRepository;

    @Autowired
    private CompanyProductRepository companyProductRepository;

    /**
     * Get all active products in the catalog
     */
    public List<MicrofinanceProduct> getAllAvailableProducts() {
        return productRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    /**
     * Search products by name (case-insensitive)
     */
    public List<MicrofinanceProduct> searchProducts(String query) {
        return productRepository.findByProductNameContainingIgnoreCase(query);
    }

    /**
     * Get products by category
     */
    public List<MicrofinanceProduct> getProductsByCategory(String category) {
        return productRepository.findByProductCategoryAndIsActiveTrue(category);
    }

    /**
     * Get all products selected by a company
     */
    public List<CompanyProduct> getCompanyProducts(Long companyId) {
        return companyProductRepository.findByCompanyIdAndIsOfferedTrue(companyId);
    }

    /**
     * Add a product to a company's offering
     */
    public CompanyProduct addProductToCompany(CompanyProduct companyProduct) {
        companyProduct.setDateAdded(LocalDate.now());
        companyProduct.setIsOffered(true);
        return companyProductRepository.save(companyProduct);
    }

    /**
     * Add a custom product for a company
     */
    public CompanyProduct addCustomProduct(CompanyProduct companyProduct) {
        // Create a new custom product in the catalog
        MicrofinanceProduct customProduct = new MicrofinanceProduct();
        customProduct.setProductCategory("OTHER");
        customProduct.setProductName(companyProduct.getCustomProductName());
        customProduct.setDescription(companyProduct.getCustomProductDescription());
        customProduct.setIsActive(true);
        customProduct.setIsPredefined(false);

        MicrofinanceProduct savedProduct = productRepository.save(customProduct);

        // Link it to the company
        companyProduct.setProductId(savedProduct.getId());
        companyProduct.setDateAdded(LocalDate.now());
        companyProduct.setIsOffered(true);

        return companyProductRepository.save(companyProduct);
    }

    /**
     * Remove a product from company's offering
     */
    public void removeProductFromCompany(Long companyId, Long productId) {
        companyProductRepository.deleteByCompanyIdAndProductId(companyId, productId);
    }

    /**
     * Update company product details
     */
    public CompanyProduct updateCompanyProduct(Long companyProductId, CompanyProduct updatedDetails) {
        Optional<CompanyProduct> existing = companyProductRepository.findById(companyProductId);

        if (existing.isPresent()) {
            CompanyProduct product = existing.get();
            product.setMinimumAmount(updatedDetails.getMinimumAmount());
            product.setMaximumAmount(updatedDetails.getMaximumAmount());
            product.setMinimumTenure(updatedDetails.getMinimumTenure());
            product.setMaximumTenure(updatedDetails.getMaximumTenure());
            product.setInterestRatePerMonth(updatedDetails.getInterestRatePerMonth());
            product.setInterestRatePerAnnum(updatedDetails.getInterestRatePerAnnum());
            product.setAdditionalCharges(updatedDetails.getAdditionalCharges());
            product.setLastModified(LocalDate.now());

            return companyProductRepository.save(product);
        }

        throw new RuntimeException("Company product not found with id: " + companyProductId);
    }

    /**
     * Get count of products offered by a company
     */
    public Long getCompanyProductCount(Long companyId) {
        return companyProductRepository.countByCompanyIdAndIsOfferedTrue(companyId);
    }

    /**
     * Initialize the product catalog with predefined products
     * This should be called on system initialization
     */
    @Transactional
    public void initializeProductCatalog() {
        // Check if catalog is already initialized
        List<MicrofinanceProduct> existing = productRepository.findByIsPredefinedTrue();
        if (!existing.isEmpty()) {
            return; // Already initialized
        }

        // Define predefined products
        createProduct("LOAN", "Personal Loan", "Short-term personal loans for individuals", "SHORT_TERM", 1);
        createProduct("LOAN", "Business Loan", "Loans for small and medium enterprises", "MEDIUM_TERM", 2);
        createProduct("LOAN", "Agricultural Loan", "Financing for agricultural activities", "MEDIUM_TERM", 3);
        createProduct("LOAN", "Salary-based Loan", "Loans based on salary deductions", "SHORT_TERM", 4);
        createProduct("LOAN", "Asset-backed Loan", "Loans secured by assets", "MEDIUM_TERM", 5);
        createProduct("LOAN", "Emergency Loan", "Quick access loans for emergencies", "SHORT_TERM", 6);
        createProduct("LOAN", "Education Loan", "Financing for educational expenses", "LONG_TERM", 7);
        createProduct("LOAN", "Medical Loan", "Loans for medical expenses", "SHORT_TERM", 8);
        createProduct("LOAN", "Housing Improvement Loan", "Loans for home improvements", "LONG_TERM", 9);
        createProduct("LOAN", "Microenterprise Loan", "Small loans for micro businesses", "SHORT_TERM", 10);
        createProduct("LOAN", "Group Loan", "Loans to solidarity groups", "MEDIUM_TERM", 11);
        createProduct("LOAN", "Individual Loan", "Standard individual loans", "MEDIUM_TERM", 12);
        createProduct("LOAN", "Working Capital Loan", "Loans for business working capital", "SHORT_TERM", 13);
        createProduct("LOAN", "Equipment Finance", "Financing for equipment purchase", "LONG_TERM", 14);

        createProduct("BILL_DISCOUNTING", "Invoice Discounting", "Advance payment against invoices", "SHORT_TERM", 15);
        createProduct("BILL_DISCOUNTING", "Trade Bills", "Financing for trade bills", "SHORT_TERM", 16);
        createProduct("BILL_DISCOUNTING", "Commodity Bills", "Bills for commodity trading", "SHORT_TERM", 17);

        createProduct("LEASE_FINANCE", "Asset Leasing", "Leasing of equipment and vehicles", "LONG_TERM", 18);
        createProduct("LEASE_FINANCE", "Vehicle Finance", "Financing for vehicle purchase", "LONG_TERM", 19);
    }

    private void createProduct(String category, String name, String description, String type, int order) {
        MicrofinanceProduct product = new MicrofinanceProduct();
        product.setProductCategory(category);
        product.setProductName(name);
        product.setDescription(description);
        product.setProductType(type);
        product.setIsActive(true);
        product.setIsPredefined(true);
        product.setDisplayOrder(order);

        productRepository.save(product);
    }
}

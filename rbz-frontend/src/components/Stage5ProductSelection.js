import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Badge, Alert, Modal, Row, Col, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';

/**
 * Stage 5: Product Selection
 * Comprehensive product catalog for credit-only microfinance institutions
 */
function Stage5ProductSelection({ companyId, onComplete }) {
    const [allProducts, setAllProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productDetails, setProductDetails] = useState({
        minimumAmount: '',
        maximumAmount: '',
        minimumTenure: '',
        maximumTenure: '',
        interestRatePerMonth: '',
        additionalCharges: ''
    });
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customProduct, setCustomProduct] = useState({
        name: '',
        description: ''
    });
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchProductCatalog();
        if (companyId) {
            fetchCompanyProducts();
        }
    }, [companyId]);

    const fetchProductCatalog = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/products/catalog');
            setAllProducts(response.data);
        } catch (error) {
            console.error('Error fetching product catalog:', error);
            setAlert({ type: 'danger', message: 'Error loading product catalog' });
        }
    };

    const fetchCompanyProducts = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/products/company/${companyId}`);
            setSelectedProducts(response.data);
        } catch (error) {
            console.error('Error fetching company products:', error);
        }
    };

    const handleSelectProduct = (product) => {
        setCurrentProduct(product);
        setProductDetails({
            minimumAmount: '',
            maximumAmount: '',
            minimumTenure: '',
            maximumTenure: '',
            interestRatePerMonth: '',
            additionalCharges: ''
        });
        setShowProductModal(true);
    };

    const handleAddProduct = async () => {
        if (!productDetails.minimumAmount || !productDetails.maximumAmount) {
            setAlert({ type: 'warning', message: 'Please fill in all required fields' });
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8080/api/products/company/${companyId}/add`,
                {
                    productId: currentProduct.id,
                    ...productDetails
                }
            );

            setSelectedProducts([...selectedProducts, response.data]);
            setAlert({ type: 'success', message: `${currentProduct.productName} added successfully!` });
            setShowProductModal(false);
            setCurrentProduct(null);
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error adding product: ' + (error.response?.data?.message || error.message) });
        }
    };

    const handleAddCustomProduct = async () => {
        if (!customProduct.name) {
            setAlert({ type: 'warning', message: 'Please provide a product name' });
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8080/api/products/company/${companyId}/add-custom`,
                {
                    customProductName: customProduct.name,
                    customProductDescription: customProduct.description,
                    ...productDetails
                }
            );

            setSelectedProducts([...selectedProducts, response.data]);
            setAlert({ type: 'success', message: `Custom product "${customProduct.name}" added successfully!` });
            setShowCustomModal(false);
            setCustomProduct({ name: '', description: '' });
            setProductDetails({
                minimumAmount: '',
                maximumAmount: '',
                minimumTenure: '',
                maximumTenure: '',
                interestRatePerMonth: '',
                additionalCharges: ''
            });
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error adding custom product: ' + error.message });
        }
    };

    const handleRemoveProduct = async (companyProductId) => {
        if (window.confirm('Are you sure you want to remove this product?')) {
            try {
                const product = selectedProducts.find(p => p.id === companyProductId);
                await axios.delete(`http://localhost:8080/api/products/company/${companyId}/remove/${product.productId}`);
                setSelectedProducts(selectedProducts.filter(p => p.id !== companyProductId));
                setAlert({ type: 'success', message: 'Product removed successfully!' });
            } catch (error) {
                setAlert({ type: 'danger', message: 'Error removing product: ' + error.message });
            }
        }
    };

    // Filter products
    const filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'ALL' || product.productCategory === activeCategory;
        // Don't show already selected products
        const notSelected = !selectedProducts.some(sp => sp.productId === product.id);
        return matchesSearch && matchesCategory && notSelected;
    });

    const categories = ['ALL', 'LOAN', 'BILL_DISCOUNTING', 'LEASE_FINANCE'];
    const categoryLabels = {
        'ALL': 'All Products',
        'LOAN': 'Loans',
        'BILL_DISCOUNTING': 'Bill Discounting',
        'LEASE_FINANCE': 'Lease Finance'
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">💼 Stage 5: Products & Services</h4>
                        <Badge bg="light" text="dark">
                            {selectedProducts.length} Product(s) Selected
                        </Badge>
                    </div>
                </Card.Header>
                <Card.Body>
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                            {alert.message}
                        </Alert>
                    )}

                    <Alert variant="info">
                        <strong>Instructions:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Browse and select products from the catalog below</li>
                            <li>Specify loan amounts, tenure, and interest rates for each product</li>
                            <li>You can add custom products using the "Add Other Product" button</li>
                        </ul>
                    </Alert>

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">✅ Selected Products</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table striped bordered hover responsive>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th>Min Amount</th>
                                            <th>Max Amount</th>
                                            <th>Tenure</th>
                                            <th>Interest Rate</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <strong>{product.customProductName || allProducts.find(p => p.id === product.productId)?.productName}</strong>
                                                </td>
                                                <td>
                                                    <Badge bg="info">
                                                        {allProducts.find(p => p.id === product.productId)?.productCategory || 'OTHER'}
                                                    </Badge>
                                                </td>
                                                <td>${product.minimumAmount?.toLocaleString()}</td>
                                                <td>${product.maximumAmount?.toLocaleString()}</td>
                                                <td>{product.minimumTenure} - {product.maximumTenure}</td>
                                                <td>{product.interestRatePerMonth}% per month</td>
                                                <td>
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => handleRemoveProduct(product.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Product Catalog */}
                    <Card>
                        <Card.Header>
                            <h5>📚 Product Catalog</h5>
                        </Card.Header>
                        <Card.Body>
                            {/* Search Bar */}
                            <Row className="mb-3">
                                <Col md={8}>
                                    <Form.Control
                                        type="text"
                                        placeholder="🔍 Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Button
                                        variant="success"
                                        className="w-100"
                                        onClick={() => setShowCustomModal(true)}
                                    >
                                        + Add Other Product
                                    </Button>
                                </Col>
                            </Row>

                            {/* Category Tabs */}
                            <Tabs
                                activeKey={activeCategory}
                                onSelect={(k) => setActiveCategory(k)}
                                className="mb-3"
                            >
                                {categories.map((cat) => (
                                    <Tab key={cat} eventKey={cat} title={categoryLabels[cat]}>
                                        <Row>
                                            {filteredProducts.length === 0 ? (
                                                <Col>
                                                    <Alert variant="secondary" className="text-center">
                                                        No products found in this category{searchQuery && ' matching your search'}.
                                                    </Alert>
                                                </Col>
                                            ) : (
                                                filteredProducts.map((product) => (
                                                    <Col md={6} lg={4} key={product.id} className="mb-3">
                                                        <Card className="h-100 shadow-sm">
                                                            <Card.Body>
                                                                <Card.Title className="text-primary">
                                                                    {product.productName}
                                                                </Card.Title>
                                                                <Badge bg="secondary" className="mb-2">
                                                                    {product.productCategory}
                                                                </Badge>
                                                                <Card.Text className="text-muted small">
                                                                    {product.description}
                                                                </Card.Text>
                                                            </Card.Body>
                                                            <Card.Footer className="bg-white">
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="w-100"
                                                                    onClick={() => handleSelectProduct(product)}
                                                                >
                                                                    + Add Product
                                                                </Button>
                                                            </Card.Footer>
                                                        </Card>
                                                    </Col>
                                                ))
                                            )}
                                        </Row>
                                    </Tab>
                                ))}
                            </Tabs>
                        </Card.Body>
                    </Card>

                    {/* Navigation */}
                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="secondary">← Previous Stage</Button>
                        <Button
                            variant="primary"
                            onClick={onComplete}
                            disabled={selectedProducts.length === 0}
                        >
                            Next Stage →
                        </Button>
                    </div>

                    {selectedProducts.length === 0 && (
                        <Alert variant="warning" className="mt-3">
                            ⚠️ Please select at least one product before proceeding.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Product Details Modal */}
            <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Product: {currentProduct?.productName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Loan Amount (US$) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="e.g., 100"
                                        value={productDetails.minimumAmount}
                                        onChange={(e) => setProductDetails({ ...productDetails, minimumAmount: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Loan Amount (US$) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="e.g., 10000"
                                        value={productDetails.maximumAmount}
                                        onChange={(e) => setProductDetails({ ...productDetails, maximumAmount: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Tenure</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., 1 month"
                                        value={productDetails.minimumTenure}
                                        onChange={(e) => setProductDetails({ ...productDetails, minimumTenure: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Tenure</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., 24 months"
                                        value={productDetails.maximumTenure}
                                        onChange={(e) => setProductDetails({ ...productDetails, maximumTenure: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Interest Rate (% per month) *</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                placeholder="e.g., 5.0"
                                value={productDetails.interestRatePerMonth}
                                onChange={(e) => setProductDetails({ ...productDetails, interestRatePerMonth: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Maximum allowed: 10% per month
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Additional Charges</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="e.g., Processing fee: 2%, Late payment fee: $10"
                                value={productDetails.additionalCharges}
                                onChange={(e) => setProductDetails({ ...productDetails, additionalCharges: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProductModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddProduct}>
                        Add Product
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Custom Product Modal */}
            <Modal show={showCustomModal} onHide={() => setShowCustomModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Custom Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Product Name *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter custom product name"
                                value={customProduct.name}
                                onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Product Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Describe your custom product"
                                value={customProduct.description}
                                onChange={(e) => setCustomProduct({ ...customProduct, description: e.target.value })}
                            />
                        </Form.Group>
                        <hr />
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Loan Amount (US$) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={productDetails.minimumAmount}
                                        onChange={(e) => setProductDetails({ ...productDetails, minimumAmount: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Loan Amount (US$) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={productDetails.maximumAmount}
                                        onChange={(e) => setProductDetails({ ...productDetails, maximumAmount: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Tenure</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., 1 month"
                                        value={productDetails.minimumTenure}
                                        onChange={(e) => setProductDetails({ ...productDetails, minimumTenure: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Tenure</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., 24 months"
                                        value={productDetails.maximumTenure}
                                        onChange={(e) => setProductDetails({ ...productDetails, maximumTenure: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Interest Rate (% per month) *</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.01"
                                value={productDetails.interestRatePerMonth}
                                onChange={(e) => setProductDetails({ ...productDetails, interestRatePerMonth: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCustomModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddCustomProduct}>
                        Add Custom Product
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Stage5ProductSelection;

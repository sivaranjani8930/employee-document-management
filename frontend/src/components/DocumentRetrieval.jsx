import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Table, Badge, Modal, Pagination } from 'react-bootstrap';
import { Search, Eye, Download, History, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { searchDocuments, downloadDocument } from '../api';
import DocumentPreview from './DocumentPreview';
import VersionHistory from './VersionHistory';
import UpdateDocumentModal from './UpdateDocumentModal';
import './DocumentRetrieval.css';

const DocumentRetrieval = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    employeeId: '',
    employeeName: '',
    store: '',
    documentType: '',
    issueDate: '',
    expiryDate: ''
  });
  const [allDocuments, setAllDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [previewDocument, setPreviewDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedDocumentForVersion, setSelectedDocumentForVersion] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDocumentForUpdate, setSelectedDocumentForUpdate] = useState(null);
  const [availableStores, setAvailableStores] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState('10');

  // Employee store mapping - matches actual data
  const employeeStoreMapping = [
    { id: 'EMP001', name: 'Rajesh Kumar', store: 'Station Alpha' },
    { id: 'EMP002', name: 'Priya Singh', store: 'Station Beta' },
    { id: 'EMP003', name: 'Amit Patel', store: 'Store Gamma' },
    { id: 'EMP004', name: 'Sneha Reddy', store: 'Station Delta' },
    { id: 'EMP005', name: 'Vikram Sharma', store: 'Store Epsilon' },
    { id: 'EMP006', name: 'Anita Verma', store: 'Station Zeta' },
    { id: 'EMP007', name: 'Rohan Mehta', store: 'Station Eta' },
    { id: 'EMP008', name: 'Sonal Gupta', store: 'Station Theta' },
    { id: 'EMP009', name: 'Karan Singh', store: 'Station Iota' },
    { id: 'EMP010', name: 'Meera Nair', store: 'Station Kappa' }
  ];

  // Helper function to normalize date to YYYY-MM-DD
  const normalizeDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  // Client-side filtering function
  const filterDocuments = (docs, criteria) => {
    return docs.filter(doc => {
      // Employee ID filter
      if (criteria.employeeId && criteria.employeeId.trim() !== '') {
        if (!doc.employeeId?.toLowerCase().includes(criteria.employeeId.toLowerCase())) {
          return false;
        }
      }

      // Employee Name filter
      if (criteria.employeeName && criteria.employeeName.trim() !== '') {
        if (!doc.employeeName?.toLowerCase().includes(criteria.employeeName.toLowerCase())) {
          return false;
        }
      }

      // Store filter
      if (criteria.store && criteria.store.trim() !== '') {
        if (doc.store !== criteria.store) {
          return false;
        }
      }

      // Document Type filter
      if (criteria.documentType && criteria.documentType.trim() !== '') {
        if (doc.documentType !== criteria.documentType) {
          return false;
        }
      }

      // Issue Date filter
      if (criteria.issueDate && criteria.issueDate.trim() !== '') {
        const searchDate = normalizeDate(criteria.issueDate);
        const docDate = normalizeDate(doc.issueDate);
        if (!docDate || docDate !== searchDate) {
          return false;
        }
      }

      // Expiry Date filter
      if (criteria.expiryDate && criteria.expiryDate.trim() !== '') {
        const searchDate = normalizeDate(criteria.expiryDate);
        const docDate = normalizeDate(doc.expiryDate);
        if (!docDate || docDate !== searchDate) {
          return false;
        }
      }

      return true;
    });
  };

  const loadDocuments = useCallback(async () => {
    try {
      const response = await searchDocuments({});
      if (response.data && response.data.data) {
        const docs = response.data.data.map(doc => {
          // Find employee mapping to get correct store name
          const employee = employeeStoreMapping.find(emp => emp.id === doc.employeeId);
          return {
            ...doc,
            store: employee ? employee.store : doc.store,
            employeeName: employee ? employee.name : doc.employeeName,
            status: getStatusColor(doc.expiryDate)
          };
        });

        setAllDocuments(docs);
        setFilteredDocuments(docs);

        // Extract unique stores from actual data
        const uniqueStores = [...new Set(docs.map(doc => doc.store))]
          .filter(Boolean)
          .sort();
        setAvailableStores(uniqueStores);

        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setAllDocuments([]);
      setFilteredDocuments([]);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const documentTypes = [
    'ID Proof',
    'Driving License',
    'Medical Certificate',
    'Training Certificate',
    'Employment Contract',
    'Educational Certificate',
    'Address Proof',
    'Police Verification'
  ];

  const getStatusBadge = (status) => {
    const badges = {
      valid: { variant: 'success', text: 'Valid' },
      expiring: { variant: 'warning', text: 'Expiring Soon' },
      expired: { variant: 'danger', text: 'Expired' }
    };
    return badges[status] || badges.valid;
  };

  const getStatusColor = (expiryDate) => {
    if (!expiryDate) return 'valid';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const handleSearch = async () => {
    try {
      // Use client-side filtering
      const results = filterDocuments(allDocuments, searchCriteria);
      setFilteredDocuments(results);
      setCurrentPage(1);
      toast.info(`Found ${results.length} document(s)`, {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error) {
      toast.error('Error searching documents', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleReset = () => {
    setSearchCriteria({
      employeeId: '',
      employeeName: '',
      store: '',
      documentType: '',
      issueDate: '',
      expiryDate: ''
    });
    setFilteredDocuments(allDocuments);
    setCurrentPage(1);
    toast.info('Search criteria reset', {
      position: 'top-right',
      autoClose: 2000
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredDocuments].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDocuments(sorted);
  };

  const handleView = (doc) => {
    setPreviewDocument(doc);
    setShowPreview(true);
  };

  const handleDownload = async (doc) => {
    try {
      // Extract numeric ID properly
      let docId = doc.id;
      if (typeof docId === 'string') {
        docId = docId.replace(/^DOC0*/i, '');
        const numericMatch = docId.match(/\d+/);
        if (numericMatch) {
          docId = numericMatch[0];
        }
      }

      const response = await downloadDocument(docId);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: response.headers?.['content-type'] });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.fileName || `document_${doc.id}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error downloading document', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleVersionHistory = (doc) => {
    setSelectedDocumentForVersion(doc);
    setShowVersionHistory(true);
  };

  const handleUpdateDocument = (doc) => {
    setSelectedDocumentForUpdate(doc);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    loadDocuments();
    setShowUpdateModal(false);
    toast.success('Document updated successfully', {
      position: 'top-right',
      autoClose: 3000
    });
  };

  const totalPages = Math.ceil(filteredDocuments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e) => {
    const value = e.target.value;
    setPageSizeInput(value);

    if (value === '') {
      setPageSize(10);
      setCurrentPage(1);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setPageSize(numValue);
      setCurrentPage(1);
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="document-retrieval">
      <Card className="retrieval-card">
        <div className="card-header-custom">
          <h3>
            <Search className="me-2" size={24} />
            Document Retrieval & Search
          </h3>
        </div>
        <Card.Body>
          <Card className="search-card mb-4">
            <Card.Body>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Employee ID"
                    value={searchCriteria.employeeId}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, employeeId: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Employee Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter Employee Name"
                    value={searchCriteria.employeeName}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, employeeName: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Store</Form.Label>
                  <Form.Select
                    value={searchCriteria.store}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, store: e.target.value })}
                  >
                    <option value="">All Stores</option>
                    {availableStores.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <Form.Label>Document Type</Form.Label>
                  <Form.Select
                    value={searchCriteria.documentType}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, documentType: e.target.value })}
                  >
                    <option value="">All Types</option>
                    {documentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-4">
                  <Form.Label>Issue Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={searchCriteria.issueDate}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, issueDate: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={searchCriteria.expiryDate}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-center gap-2">
                <Button variant="primary" onClick={handleSearch} className="px-4">
                  <Search className="me-2" size={18} />
                  Search
                </Button>
                <Button variant="outline-secondary" onClick={handleReset} className="px-4">
                  Reset
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="text-muted">Show</span>
            <Form.Control
              type="number"
              size="sm"
              min="1"
              max="100"
              placeholder="10"
              style={{ width: '80px' }}
              value={pageSizeInput}
              onChange={handlePageSizeChange}
            />
            <span className="text-muted">entries</span>
          </div>

          <div className="table-responsive">
            <Table hover className="results-table">
              <thead>
                <tr>
                  <th>
                    S.No.
                  </th>
                  <th onClick={() => handleSort('employeeName')} className="sortable">
                    Employee Name {sortConfig.key === 'employeeName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('store')} className="sortable">
                    Store {sortConfig.key === 'store' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('documentType')} className="sortable">
                    Document Type {sortConfig.key === 'documentType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('expiryDate')} className="sortable">
                    Expiry Date {sortConfig.key === 'expiryDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No documents found. Try adjusting your search criteria.
                    </td>
                  </tr>
                ) : (
                  currentDocuments.map((doc, index) => {
                    const status = getStatusBadge(doc.status);
                    return (
                      <tr key={doc.id}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          <div>
                            {doc.employeeName}
                            <br />
                            <small className="text-muted">{doc.employeeId}</small>
                          </div>
                        </td>
                        <td>{doc.store}</td>
                        <td>{doc.documentType}</td>
                        <td>{doc.expiryDate || 'N/A'}</td>
                        <td>
                          <Badge bg={status.variant}>{status.text}</Badge>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleView(doc)}
                              className="action-btn"
                              title="View"
                            >
                              <Eye size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="action-btn"
                              title="Download"
                            >
                              <Download size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleVersionHistory(doc)}
                              className="action-btn"
                              title="Version History"
                            >
                              <History size={18} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleUpdateDocument(doc)}
                              className="action-btn"
                              title="Update Document"
                            >
                              <Upload size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {filteredDocuments.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} entries
              </div>
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />

                {getPaginationItems().map((item, index) => (
                  item === '...' ? (
                    <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
                  ) : (
                    <Pagination.Item
                      key={item}
                      active={item === currentPage}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </Pagination.Item>
                  )
                ))}

                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreview
        show={showPreview}
        onHide={() => setShowPreview(false)}
        document={previewDocument}
      />

      {/* Version History Modal */}
      <Modal
        show={showVersionHistory}
        onHide={() => setShowVersionHistory(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Version History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocumentForVersion && (
            <VersionHistory documentId={selectedDocumentForVersion.id} />
          )}
        </Modal.Body>
      </Modal>

      {/* Update Document Modal */}
      {showUpdateModal && selectedDocumentForUpdate && (
        <UpdateDocumentModal
          show={showUpdateModal}
          onHide={() => setShowUpdateModal(false)}
          documentId={selectedDocumentForUpdate.id}
          onUpdated={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default DocumentRetrieval;
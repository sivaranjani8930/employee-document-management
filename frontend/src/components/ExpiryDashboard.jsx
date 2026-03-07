import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Badge, Row, Col, Alert, Pagination, Form } from 'react-bootstrap';
import { Clock, Bell, AlertCircle, CheckCircle, TrendingUp, RefreshCw, Filter, X } from 'lucide-react';
import { searchDocuments, triggerExpiryNotifications } from '../api';
import { toast } from 'react-toastify';
import './ExpiryDashboard.css';

const ExpiryDashboard = () => {
  const [expiries, setExpiries] = useState([]);
  const [filteredExpiries, setFilteredExpiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState('10');
  const [stats, setStats] = useState({
    expired: 0,
    expiring5Days: 0,
    expiring30Days: 0,
    total: 0
  });

  // Use EXACT same calculation logic as ComplianceDashboard
  const getStatusColor = (expiryDate) => {
    if (!expiryDate) return 'valid';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return 'expired';  // Today and all past dates
    if (daysUntilExpiry <= 30) return 'expiring'; // Days 1-30
    return 'valid';
  };

  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  };

  const load = async () => {
    setLoading(true);
    try {
      // USE SAME API AS COMPLIANCE DASHBOARD - searchDocuments instead of getExpiries
      const res = await searchDocuments({});

      if (res.data && res.data.data) {
        const documents = res.data.data;

        // Process documents with SAME logic as ComplianceDashboard
        const processedData = documents.map(doc => {
          const daysLeft = calculateDaysUntilExpiry(doc.expiryDate);
          const status = getStatusColor(doc.expiryDate);

          return {
            id: doc._id || doc.id,
            docId: doc.documentId || doc.docId,
            fileName: doc.documentName || doc.fileName || '',
            employeeName: doc.employeeName || '',
            employeeId: doc.employeeId || '',
            documentType: doc.documentType || '',
            expiryDate: doc.expiryDate,
            daysLeft: daysLeft,
            status: status
          };
        });

        setExpiries(processedData);

        // Apply current filter to new data
        applyFilter(activeFilter, processedData);

        // Calculate statistics using EXACT same logic as ComplianceDashboard
        // EXPIRED: daysUntilExpiry <= 0 (Today and all past dates)
        const expiredDocs = processedData.filter(e => e.daysLeft <= 0);

        // EXPIRING SOON (Critical): Days 1-5
        const expiring5Docs = processedData.filter(e => e.daysLeft >= 1 && e.daysLeft <= 5);

        // EXPIRING SOON (Warning): Days 6-30
        const expiring30Docs = processedData.filter(e => e.daysLeft >= 6 && e.daysLeft <= 30);

        // Debug logging
        console.log('=== EXPIRY DASHBOARD DEBUG ===');
        console.log('API Used: searchDocuments()');
        console.log('Total documents loaded:', processedData.length);
        console.log('Expired (days <= 0):', expiredDocs.length);
        console.log('Expired documents:', expiredDocs.map(d => ({
          id: d.docId,
          expiry: d.expiryDate,
          daysLeft: d.daysLeft
        })));
        console.log('Expiring 1-5 days:', expiring5Docs.length);
        console.log('Expiring 6-30 days:', expiring30Docs.length);
        console.log('==============================');

        setStats({
          expired: expiredDocs.length,
          expiring5Days: expiring5Docs.length,
          expiring30Days: expiring30Docs.length,
          total: processedData.length
        });
      }
    } catch (err) {
      console.error('Error loading expiry data:', err);
      toast.error('Failed to load expiry data', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const applyFilter = (filterType, data = expiries) => {
    setCurrentPage(1); // Reset to first page when filter changes
    switch (filterType) {
      case 'expired':
        // EXPIRED: Show only documents with days <= 0 (today and all past dates)
        setFilteredExpiries(data.filter(e => e.daysLeft <= 0));
        break;
      case 'expiring5':
        // EXPIRING CRITICAL: Show documents with days 1-5
        setFilteredExpiries(data.filter(e => e.daysLeft >= 1 && e.daysLeft <= 5));
        break;
      case 'expiring30':
        // EXPIRING WARNING: Show documents with days 6-30
        setFilteredExpiries(data.filter(e => e.daysLeft >= 6 && e.daysLeft <= 30));
        break;
      case 'all':
      default:
        setFilteredExpiries(data);
        break;
    }
  };

  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType);
    applyFilter(filterType);
  };

  const clearFilter = () => {
    setActiveFilter('all');
    setFilteredExpiries(expiries);
    setCurrentPage(1);
  };

  const handleTrigger = async () => {
    try {
      const res = await triggerExpiryNotifications();
      toast.success(res.data?.message || 'Notifications triggered successfully!', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (err) {
      toast.error('Failed to trigger notifications', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const getStatusBadge = (daysLeft) => {
    // EXPIRED: Days <= 0 (Today and all past dates)
    if (daysLeft <= 0) {
      return <Badge bg="danger" className="px-3 py-2">Expired</Badge>;
    }
    // CRITICAL: Days 1-5
    else if (daysLeft >= 1 && daysLeft <= 5) {
      return <Badge bg="danger" className="px-3 py-2">Critical - {daysLeft} days</Badge>;
    }
    // WARNING: Days 6-15
    else if (daysLeft >= 6 && daysLeft <= 15) {
      return <Badge bg="warning" className="px-3 py-2">Warning - {daysLeft} days</Badge>;
    }
    // NOTICE: Days 16-30
    else if (daysLeft >= 16 && daysLeft <= 30) {
      return <Badge bg="info" className="px-3 py-2">Notice - {daysLeft} days</Badge>;
    }
    // VALID: Days > 30
    else {
      return <Badge bg="success" className="px-3 py-2">Valid - {daysLeft} days</Badge>;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredExpiries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentDocuments = filteredExpiries.slice(startIndex, endIndex);

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
        items.push(currentPage - 1);
        items.push(currentPage);
        items.push(currentPage + 1);
        items.push('...');
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="expiry-dashboard">
      {/* Header Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-gradient-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1">
                <Clock className="me-2" size={28} />
                Expiry Tracking System
              </h3>
              <p className="mb-0 opacity-75">Monitor and manage document expiry dates with automated alerts</p>
            </div>
            <div>
              <Button
                variant="light"
                size="sm"
                onClick={load}
                className="me-2"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </Button>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Statistics Cards - Clickable Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <Card
            className={`stats-card border-0 shadow-sm h-100 clickable-card ${activeFilter === 'expired' ? 'active-filter-card' : ''}`}
            onClick={() => handleFilterClick('expired')}
            style={{ cursor: 'pointer' }}
            title="Click to view expired documents (Days ≤ 0)"
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">EXPIRED</div>
                  <h2 className="mb-0 text-danger fw-bold">{stats.expired}</h2>
                </div>
                <div className="stats-icon bg-danger">
                  <AlertCircle size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-danger">
                  <TrendingUp size={12} className="me-1" />
                  Requires immediate action
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`stats-card border-0 shadow-sm h-100 clickable-card ${activeFilter === 'expiring5' ? 'active-filter-card' : ''}`}
            onClick={() => handleFilterClick('expiring5')}
            style={{ cursor: 'pointer' }}
            title="Click to view documents expiring in 1-5 days"
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">EXPIRING (1-5 DAYS)</div>
                  <h2 className="mb-0 text-danger fw-bold">{stats.expiring5Days}</h2>
                </div>
                <div className="stats-icon bg-danger">
                  <Bell size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-danger">
                  Critical alert window
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`stats-card border-0 shadow-sm h-100 clickable-card ${activeFilter === 'expiring30' ? 'active-filter-card' : ''}`}
            onClick={() => handleFilterClick('expiring30')}
            style={{ cursor: 'pointer' }}
            title="Click to view documents expiring in 6-30 days"
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">EXPIRING (6-30 DAYS)</div>
                  <h2 className="mb-0 text-warning fw-bold">{stats.expiring30Days}</h2>
                </div>
                <div className="stats-icon bg-warning">
                  <Clock size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-warning">
                  Upcoming renewals
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className={`stats-card border-0 shadow-sm h-100 clickable-card ${activeFilter === 'all' ? 'active-filter-card' : ''}`}
            onClick={() => handleFilterClick('all')}
            style={{ cursor: 'pointer' }}
            title="Click to view all documents"
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1">TOTAL MONITORED</div>
                  <h2 className="mb-0 text-primary fw-bold">{stats.total}</h2>
                </div>
                <div className="stats-icon bg-primary">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-primary">
                  Documents tracked
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alert Banners */}
      {stats.expired > 0 && (
        <Alert variant="danger" className="mb-4">
          <AlertCircle className="me-2" size={20} />
          <strong>Action Required:</strong> {stats.expired} document(s) have expired. Please renew immediately.
        </Alert>
      )}

      {stats.expiring5Days > 0 && (
        <Alert variant="warning" className="mb-4">
          <Bell className="me-2" size={20} />
          <strong>Critical Alert:</strong> {stats.expiring5Days} document(s) expiring within 1-5 days. Renewal needed urgently.
        </Alert>
      )}

      {/* Expiry Data Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <AlertCircle className="me-2" size={20} />
              Expiry Tracking & Notifications
            </h5>
            {activeFilter !== 'all' && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearFilter}
              >
                <X size={16} className="me-1" />
                Clear Filter
              </Button>
            )}
          </div>
          {activeFilter !== 'all' && (
            <div className="mt-3">
              <Badge bg="info" className="px-3 py-2">
                <Filter size={14} className="me-1" />
                Showing: {
                  activeFilter === 'expired' ? `Expired Documents (${filteredExpiries.length})` :
                    activeFilter === 'expiring5' ? `Documents Expiring in 1-5 Days (${filteredExpiries.length})` :
                      activeFilter === 'expiring30' ? `Documents Expiring in 6-30 Days (${filteredExpiries.length})` :
                        `All Documents (${filteredExpiries.length})`
                }
              </Badge>
            </div>
          )}
        </Card.Header>
        <Card.Body>
          {/* Page Size Control */}
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

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading expiry data...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="expiry-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Expiry Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-5">
                          <CheckCircle size={48} className="text-success mb-3" />
                          <p className="mb-0">
                            {activeFilter === 'all'
                              ? 'No documents found'
                              : activeFilter === 'expired'
                                ? 'No expired documents found'
                                : 'No documents match the selected filter'
                            }
                          </p>
                          <small className="text-muted">
                            {activeFilter === 'all'
                              ? 'Upload documents to start tracking'
                              : activeFilter === 'expired'
                                ? 'All documents are valid (no documents with expiry date ≤ today)'
                                : 'Try selecting a different filter option'
                            }
                          </small>
                        </td>
                      </tr>
                    ) : (
                      currentDocuments.map((e, index) => {
                        return (
                          <tr key={e.id || index}>
                            <td>
                              <div>
                                <strong>{startIndex + index + 1}</strong>
                                <br />
                                <small className="text-muted">{e.fileName}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                {e.employeeName}
                                <br />
                                <small className="text-muted">{e.employeeId}</small>
                              </div>
                            </td>
                            <td>{e.documentType}</td>
                            <td>
                              <strong>{e.expiryDate}</strong>
                            </td>
                            <td>
                              <span className={
                                e.daysLeft <= 0 ? 'text-danger fw-bold' :
                                  e.daysLeft <= 5 ? 'text-danger fw-bold' :
                                    e.daysLeft <= 15 ? 'text-warning fw-bold' :
                                      'text-success'
                              }>
                                {e.daysLeft <= 0
                                  ? (e.daysLeft === 0 ? 'Expires Today' : `${Math.abs(e.daysLeft)} days overdue`)
                                  : `${e.daysLeft} days`
                                }
                              </span>
                            </td>
                            <td>{getStatusBadge(e.daysLeft)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredExpiries.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredExpiries.length)} of {filteredExpiries.length} entries
                  </div>
                  <Pagination className="mb-0">
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
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ExpiryDashboard;
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Alert, Table, Dropdown, Button } from 'react-bootstrap';
import { 
  FileText, 
  Users, 
  Store as StoreIcon, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  AlertCircle,
  Clock,
  Target,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { searchDocuments } from '../api';
import './ComplianceDashboard.css';

const ComplianceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    totalDocuments: 0,
    validDocuments: 0,
    expiringDocuments: 0,
    expiredDocuments: 0,
    missingDocuments: 0,
    totalEmployees: 10,
    totalStores: 0,
    employeesWithCompleteDocuments: 0,
    employeesWithPendingDocuments: 0,
    storeWiseData: [],
    employeeWiseData: [],
    complianceRate: 0,
    allDocuments: []
  });

  const employeeStoreMapping = [
    { id: 'EMP001', name: 'Rajesh Kumar', store: 'Station Alpha' },
    { id: 'EMP002', name: 'Priya Singh', store: 'Station Beta' },
    { id: 'EMP003', name: 'Amit Patel', store: 'Store Gamma' },
    { id: 'EMP004', name: 'Sneha Reddy', store: 'Station Delta' },
    { id: 'EMP005', name: 'Vikram Sharma', store: 'Store Epsilon' },
    { id: 'EMP006', name: 'Anita Desai', store: 'Station Zeta' },
    { id: 'EMP007', name: 'Rahul Mehta', store: 'Station Eta' },
    { id: 'EMP008', name: 'Sonal Gupta', store: 'Station Theta' },
    { id: 'EMP009', name: 'Karan Singh', store: 'Station Iota' },
    { id: 'EMP010', name: 'Meera Nair', store: 'Station Kappa' },
  ];

  const mandatoryDocuments = [
    'ID Proof',
    'Address Proof',
    'Educational Certificate',
    'Employment Contract'
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const getComplianceVariant = (rate) => {
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  };

  const getComplianceBadgeClass = (rate) => {
    if (rate >= 80) return 'badge-success';
    if (rate >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const exportAllStores = () => {
    let textContent = 'STORE-WISE COMPLIANCE SUMMARY\n';
    textContent += '='.repeat(80) + '\n';
    textContent += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    textContent += '='.repeat(80) + '\n\n';
    
    dashboardData.storeWiseData.forEach((store, index) => {
      textContent += `Store Name: ${store.store}\n`;
      textContent += `Total Documents: ${store.totalDocs}\n`;
      textContent += `Valid: ${store.validDocs}\n`;
      textContent += `Expiring: ${store.expiringDocs}\n`;
      textContent += `Expired: ${store.expiredDocs}\n`;
      textContent += `Employees: ${store.employeeCount}\n`;
      textContent += `Compliance Rate: ${store.complianceRate}%\n`;
      
      if (index < dashboardData.storeWiseData.length - 1) {
        textContent += '\n' + '-'.repeat(80) + '\n\n';
      }
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Store_Compliance_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateComplianceReport = () => {
    const reportData = {
      reportDateTime: new Date().toLocaleString('en-IN'),
      overallCompliance: dashboardData.complianceRate,
      totalDocuments: dashboardData.totalDocuments,
      validDocuments: dashboardData.validDocuments,
      expiringDocuments: dashboardData.expiringDocuments,
      expiredDocuments: dashboardData.expiredDocuments,
      missingDocuments: dashboardData.missingDocuments,
      stores: dashboardData.storeWiseData,
      employees: dashboardData.employeeWiseData
    };

    let reportText = 'COMPLIANCE DASHBOARD REPORT\n';
    reportText += '='.repeat(80) + '\n';
    reportText += `Generated: ${reportData.reportDateTime}\n`;
    reportText += '='.repeat(80) + '\n\n';
    
    reportText += 'OVERALL STATISTICS\n';
    reportText += '='.repeat(80) + '\n';
    reportText += `Overall Compliance Rate: ${reportData.overallCompliance}%\n`;
    reportText += `Total Documents: ${reportData.totalDocuments}\n`;
    reportText += `Valid Documents: ${reportData.validDocuments}\n`;
    reportText += `Expiring Documents: ${reportData.expiringDocuments}\n`;
    reportText += `Expired Documents: ${reportData.expiredDocuments}\n`;
    reportText += `Missing Documents: ${reportData.missingDocuments}\n\n`;
    
    reportText += 'STORE-WISE SUMMARY\n';
    reportText += '='.repeat(80) + '\n\n';
    
    reportData.stores.forEach((store, index) => {
      reportText += `Store Name: ${store.store}\n`;
      reportText += `Compliance Rate: ${store.complianceRate}%\n`;
      reportText += `Total Documents: ${store.totalDocs}\n`;
      reportText += `Valid: ${store.validDocs}\n`;
      reportText += `Expiring: ${store.expiringDocs}\n`;
      reportText += `Expired: ${store.expiredDocs}\n`;
      reportText += `Employees: ${store.employeeCount}\n`;
      
      if (index < reportData.stores.length - 1) {
        reportText += '\n' + '-'.repeat(80) + '\n\n';
      }
    });
    
    reportText += '\n\nEMPLOYEE COMPLIANCE STATUS\n';
    reportText += '='.repeat(80) + '\n\n';
    
    reportData.employees.forEach((emp, index) => {
      reportText += `Employee ID: ${emp.employeeId}\n`;
      reportText += `Employee Name: ${emp.employeeName}\n`;
      reportText += `Store: ${emp.store}\n`;
      reportText += `Total Documents: ${emp.totalDocs}\n`;
      reportText += `Valid: ${emp.validDocs}\n`;
      reportText += `Expiring: ${emp.expiringDocs}\n`;
      reportText += `Expired: ${emp.expiredDocs}\n`;
      reportText += `Missing Mandatory Documents: ${emp.missingMandatory.length}\n`;
      
      if (emp.missingMandatory.length > 0) {
        reportText += `Missing Document Types: ${emp.missingMandatory.join(', ')}\n`;
      }
      
      if (index < reportData.employees.length - 1) {
        reportText += '\n' + '-'.repeat(80) + '\n\n';
      }
    });

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Compliance_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportStoreData = (store) => {
    const storeEmployees = dashboardData.employeeWiseData.filter(emp => emp.store === store.store);
    
    let textContent = `EMPLOYEE-WISE DOCUMENT STATUS\n`;
    textContent += '='.repeat(80) + '\n';
    textContent += `Store: ${store.store}\n`;
    textContent += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    textContent += '='.repeat(80) + '\n\n';
    
    storeEmployees.forEach((emp, index) => {
      textContent += `Employee ID: ${emp.employeeId}\n`;
      textContent += `Employee Name: ${emp.employeeName}\n`;
      textContent += `Total Documents: ${emp.totalDocs}\n`;
      textContent += `Valid: ${emp.validDocs}\n`;
      textContent += `Expiring: ${emp.expiringDocs}\n`;
      textContent += `Expired: ${emp.expiredDocs}\n`;
      textContent += `Missing Mandatory Documents: ${emp.missingMandatory.length}\n`;
      
      if (emp.missingMandatory.length > 0) {
        textContent += `Missing Document Types: ${emp.missingMandatory.join(', ')}\n`;
      }
      
      if (index < storeEmployees.length - 1) {
        textContent += '\n' + '-'.repeat(80) + '\n\n';
      }
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${store.store}_Employee_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportAllEmployees = () => {
    let textContent = 'EMPLOYEE-WISE DOCUMENT STATUS\n';
    textContent += '='.repeat(80) + '\n';
    textContent += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    textContent += '='.repeat(80) + '\n\n';
    
    dashboardData.employeeWiseData.forEach((emp, index) => {
      textContent += `Employee ID: ${emp.employeeId}\n`;
      textContent += `Employee Name: ${emp.employeeName}\n`;
      textContent += `Store: ${emp.store}\n`;
      textContent += `Total Documents: ${emp.totalDocs}\n`;
      textContent += `Valid: ${emp.validDocs}\n`;
      textContent += `Expiring: ${emp.expiringDocs}\n`;
      textContent += `Expired: ${emp.expiredDocs}\n`;
      textContent += `Missing Mandatory Documents: ${emp.missingMandatory.length}\n`;
      
      if (emp.missingMandatory.length > 0) {
        textContent += `Missing Document Types: ${emp.missingMandatory.join(', ')}\n`;
      }
      
      if (index < dashboardData.employeeWiseData.length - 1) {
        textContent += '\n' + '-'.repeat(80) + '\n\n';
      }
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `All_Employees_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await searchDocuments({});
      if (response.data && response.data.data) {
        const documents = response.data.data.map(doc => {
          const employee = employeeStoreMapping.find(emp => emp.id === doc.employeeId);
          return {
            ...doc,
            store: employee ? employee.store : (doc.store || 'Unknown'),
            employeeName: doc.employeeName || (employee ? employee.name : 'Unknown'),
            status: getStatusColor(doc.expiryDate)
          };
        });

        const totalDocuments = documents.length;
        const validDocuments = documents.filter(doc => doc.status === 'valid').length;
        const expiringDocuments = documents.filter(doc => doc.status === 'expiring').length;
        const expiredDocuments = documents.filter(doc => doc.status === 'expired').length;

        const employeeDocCounts = {};
        documents.forEach(doc => {
          if (!employeeDocCounts[doc.employeeId]) {
            const emp = employeeStoreMapping.find(e => e.id === doc.employeeId);
            employeeDocCounts[doc.employeeId] = {
              employeeId: doc.employeeId,
              employeeName: emp ? emp.name : 'Unknown',
              store: emp ? emp.store : 'Unknown',
              totalDocs: 0,
              validDocs: 0,
              expiredDocs: 0,
              expiringDocs: 0,
              mandatoryDocs: [],
              missingMandatory: [],
              documents: []
            };
          }
          employeeDocCounts[doc.employeeId].totalDocs++;
          employeeDocCounts[doc.employeeId].documents.push(doc);
          if (doc.status === 'valid') employeeDocCounts[doc.employeeId].validDocs++;
          if (doc.status === 'expired') employeeDocCounts[doc.employeeId].expiredDocs++;
          if (doc.status === 'expiring') employeeDocCounts[doc.employeeId].expiringDocs++;
          
          if (mandatoryDocuments.includes(doc.documentType)) {
            employeeDocCounts[doc.employeeId].mandatoryDocs.push(doc.documentType);
          }
        });

        let totalMissingDocs = 0;
        Object.keys(employeeDocCounts).forEach(empId => {
          const missing = mandatoryDocuments.filter(
            docType => !employeeDocCounts[empId].mandatoryDocs.includes(docType)
          );
          employeeDocCounts[empId].missingMandatory = missing;
          totalMissingDocs += missing.length;
        });

        employeeStoreMapping.forEach(emp => {
          if (!employeeDocCounts[emp.id]) {
            employeeDocCounts[emp.id] = {
              employeeId: emp.id,
              employeeName: emp.name,
              store: emp.store,
              totalDocs: 0,
              validDocs: 0,
              expiredDocs: 0,
              expiringDocs: 0,
              mandatoryDocs: [],
              missingMandatory: mandatoryDocuments,
              documents: []
            };
            totalMissingDocs += mandatoryDocuments.length;
          }
        });

        const employeeWiseData = Object.values(employeeDocCounts);
        const employeesWithCompleteDocuments = employeeWiseData.filter(
          emp => emp.missingMandatory.length === 0 && emp.expiredDocs === 0
        ).length;
        const employeesWithPendingDocuments = employeeStoreMapping.length - employeesWithCompleteDocuments;

        const storeDocCounts = {};
        documents.forEach(doc => {
          if (!storeDocCounts[doc.store]) {
            storeDocCounts[doc.store] = {
              store: doc.store,
              totalDocs: 0,
              validDocs: 0,
              expiredDocs: 0,
              expiringDocs: 0,
              employees: new Set()
            };
          }
          storeDocCounts[doc.store].totalDocs++;
          if (doc.status === 'valid') storeDocCounts[doc.store].validDocs++;
          if (doc.status === 'expired') storeDocCounts[doc.store].expiredDocs++;
          if (doc.status === 'expiring') storeDocCounts[doc.store].expiringDocs++;
          storeDocCounts[doc.store].employees.add(doc.employeeId);
        });

        const allStores = new Set(employeeStoreMapping.map(emp => emp.store));
        allStores.forEach(storeName => {
          if (!storeDocCounts[storeName]) {
            storeDocCounts[storeName] = {
              store: storeName,
              totalDocs: 0,
              validDocs: 0,
              expiredDocs: 0,
              expiringDocs: 0,
              employees: new Set(employeeStoreMapping.filter(emp => emp.store === storeName).map(emp => emp.id))
            };
          }
        });

        const storeWiseData = Object.values(storeDocCounts).map(store => ({
          ...store,
          employeeCount: store.employees.size,
          complianceRate: store.totalDocs > 0 
            ? Math.round((store.validDocs / store.totalDocs) * 100) 
            : 0
        }));

        // Sort by compliance rate: Highest to Lowest
        storeWiseData.sort((a, b) => b.complianceRate - a.complianceRate);

        const overallCompliance = totalDocuments > 0 
          ? Math.round((validDocuments / totalDocuments) * 100) 
          : 0;

        setDashboardData({
          totalDocuments,
          validDocuments,
          expiringDocuments,
          expiredDocuments,
          missingDocuments: totalMissingDocs,
          totalEmployees: employeeStoreMapping.length,
          totalStores: storeWiseData.length,
          employeesWithCompleteDocuments,
          employeesWithPendingDocuments,
          storeWiseData,
          employeeWiseData,
          complianceRate: overallCompliance,
          allDocuments: documents
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-dashboard">
      <Card className="border-0 shadow-sm mb-4 bg-gradient-primary text-white">
        <Card.Body className="p-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1">
                <Target className="me-2" size={28} />
                Compliance Dashboard
              </h3>
              <p className="mb-0 opacity-75">Real-time document compliance tracking</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {viewMode === 'dashboard' && (
      <>
      <Row className="mb-3">
        <Col md={4} sm={1} className="mb-2">
          <Card className="border-0 shadow-sm stats-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small"><strong>TOTAL DOCUMENTS</strong></p>
                  <h3 className="mb-0 fw-bold">{dashboardData.totalDocuments}</h3>
                </div>
                <div className="stats-icon bg-primary">
                  <FileText size={24} />
                </div>
              </div>
               <div className="mt-3">
                <small className="text-muted">All uploaded documents</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

         <Col md={4} sm={1} className="mb-2">
          <Card className="stats-card border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1"><strong>TOTAL STORES</strong></div>
                  <h2 className="mb-0 fw-bold text-info">{dashboardData.totalStores}</h2>
                </div>
                <div className="stats-icon bg-info">
                  <StoreIcon size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-muted">Active Stores</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} sm={1} className="mb-2">
          <Card className="stats-card border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small mb-1"><strong>TOTAL EMPLOYEES</strong></div>
                  <h2 className="mb-0 fw-bold text-info">{dashboardData.totalEmployees}</h2>
                </div>
                <div className="stats-icon bg-info">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-2">
                <small className="text-muted">Active Employees</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
    
      </Row>
      
      {dashboardData.expiredDocuments > 0 && (
        <Alert variant="danger" className="mb-3">
          <XCircle className="me-2" size={20} />
          <strong>Critical:</strong> {dashboardData.expiredDocuments} document(s) have expired and require immediate renewal.
        </Alert>
      )}

      {dashboardData.missingDocuments > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="me-2" size={20} />
          <strong>Action Required:</strong> {dashboardData.missingDocuments} mandatory document(s) are missing across {dashboardData.employeesWithPendingDocuments} employee(s).
        </Alert>
      )}
   <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-1">
            <TrendingUp className="me-2" size={30} />
            Overall Compliance Rate
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="mb-2 d-flex justify-content-between">
            <span className="fw-bold">Document Compliance</span>
            <Badge 
              bg={getComplianceVariant(dashboardData.complianceRate)}
              className="fs-5"
            >
              {dashboardData.complianceRate}%
            </Badge>
          </div>
          <ProgressBar 
            now={dashboardData.complianceRate} 
            variant={getComplianceVariant(dashboardData.complianceRate)}
            style={{ height: '25px' }}
            label={`${dashboardData.complianceRate}%`}
            className="mb-3"
          />
          <div className="mt-2">
            <Row>
              <Col md={3}>
                <div className="text-center">
                  <div className="text-success fw-bold h4">{dashboardData.validDocuments}</div>
                  <div className="text-muted small">Valid</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="text-warning fw-bold h4">{dashboardData.expiringDocuments}</div>
                  <div className="text-muted small">Expiring</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="text-danger fw-bold h4">{dashboardData.expiredDocuments}</div>
                  <div className="text-muted small">Expired</div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="text-secondary fw-bold h4">{dashboardData.missingDocuments}</div>
                  <div className="text-muted small">Missing</div>
                </div>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>

      <div className="mb-5 d-flex justify-content-center gap-3">
        <Button 
          variant="primary"
          size="lg"
          onClick={() => setViewMode('stores-only')}
          className="d-flex align-items-center gap-2 px-4"
        >
          <StoreIcon size={30} />
          Store-wise Summary
        </Button>
        <Button 
          variant="primary"
          size="lg"
          onClick={() => setViewMode('employees-only')}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Users size={30} />
          Employee-wise Status
        </Button>
      </div>
      </>
      )}

      {viewMode === 'stores-only' && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <StoreIcon className="me-2" size={20} />
                  Store-wise Document Summary
                </h5>
                <small className="text-muted">Click on any store to view employee details</small>
              </div>
              <div className="d-flex gap-2">
                {viewMode === 'stores-only' && (
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setViewMode('dashboard')}
                  >
                    <XCircle size={16} className="me-1" />
                    Close
                  </Button>
                )}
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="outline-primary" 
                    size="sm"
                    id="store-actions-dropdown"
                    className="d-flex align-items-center"
                  >
                    <MoreVertical size={30} className="me-1" />
                    Actions
                  </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item onClick={exportAllStores}>
                    <Download size={14} className="me-2" />
                    Export All Stores
                  </Dropdown.Item>
                  <Dropdown.Item onClick={generateComplianceReport}>
                    <FileText size={14} className="me-2" />
                    Generate Report
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={loadDashboardData}>
                    <RefreshCw size={14} className="me-2" />
                    Refresh Dashboard
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {dashboardData.storeWiseData.length === 0 ? (
              <div className="text-center text-muted py-4">
                No store data available
              </div>
            ) : (
              <Row>
                {dashboardData.storeWiseData.map((store, idx) => (
                  <Col md={6} lg={4} xl={3} key={idx} className="mb-3">
                    <Card className="store-card h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div 
                            onClick={() => setSelectedStore(store.store)} 
                            style={{ flex: 1, cursor: 'pointer' }}
                          >
                            <h5 className="mb-1 fw-bold">{store.store}</h5>
                            <small className="text-muted">
                              <Users size={14} className="me-1" />
                              {store.employeeCount} Employees
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className={`compliance-badge ${getComplianceBadgeClass(store.complianceRate)}`}
                            >
                              {store.complianceRate}%
                            </div>
                            <Dropdown align="end">
                              <Dropdown.Toggle 
                                as="button"
                                className="btn btn-light btn-sm border-0 p-1"
                                style={{ 
                                  background: 'transparent',
                                  boxShadow: 'none'
                                }}
                              >
                                <MoreVertical size={18} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setSelectedStore(store.store)}>
                                  <Eye size={14} className="me-2" />
                                  View Details
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => exportStoreData(store)}>
                                  <Download size={14} className="me-2" />
                                  Export Data
                                </Dropdown.Item>
                                <Dropdown.Item onClick={loadDashboardData}>
                                  <RefreshCw size={14} className="me-2" />
                                  Refresh
                                </Dropdown.Item>
                                <Dropdown.Divider />
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </div>
                        
                        <div 
                          className="store-stats mb-3" 
                          onClick={() => setSelectedStore(store.store)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="stat-row">
                            Compliance Rate
                            <span className="stat-value fw-bold"></span>
                          </div>
                        </div>
                        <div 
                          onClick={() => setSelectedStore(store.store)}
                          style={{ cursor: 'pointer' }}
                        >
                          <ProgressBar 
                            now={store.complianceRate} 
                            variant={getComplianceVariant(store.complianceRate)}
                            style={{ height: '8px' }}
                            className="rounded-pill"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {viewMode === 'employees-only' && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <Users className="me-2" size={20} />
                  Employee-wise Document Status
                </h5>
                <small className="text-muted">Click on any employee to view detailed document information</small>
              </div>
              <div className="d-flex gap-2">
                {viewMode === 'employees-only' && (
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setViewMode('dashboard')}
                  >
                    <XCircle size={16} className="me-1" />
                    Close
                  </Button>
                )}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={exportAllEmployees}
                  className="d-flex align-items-center"
                >
                  <Download size={16} className="me-1" />
                  Export All Employees
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              {dashboardData.employeeWiseData
                .sort((a, b) => b.missingMandatory.length - a.missingMandatory.length)
                .map((emp, idx) => {
                  const isCompliant = emp.missingMandatory.length === 0 && emp.expiredDocs === 0;
                  return (
                    <Col md={6} lg={4} xl={3} key={idx} className="mb-3">
                      <Card 
                        className={`employee-card h-100 border-0 shadow-sm ${!isCompliant ? 'border-warning-highlight' : ''}`}
                        onClick={() => setSelectedEmployee(emp)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-0 fw-bold text-truncate">{emp.employeeName}</h6>
                              <small className="text-muted d-block">{emp.employeeId}</small>
                              <Badge bg="secondary" className="mt-1">{emp.store}</Badge>
                            </div>
                            {isCompliant ? (
                              <CheckCircle size={24} className="text-success ms-2" />
                            ) : (
                              <AlertTriangle size={24} className="text-warning ms-2" />
                            )}
                          </div>
                          
                          <div className="employee-quick-stats mt-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="small text-muted">Documents</span>
                              <span className="small fw-bold">{emp.totalDocs}</span>
                            </div>
                            <div className="d-flex gap-1 mb-2">
                              {emp.validDocs > 0 && (
                                <Badge bg="success" className="flex-fill text-center py-1">
                                  {emp.validDocs} Valid
                                </Badge>
                              )}
                              {emp.expiringDocs > 0 && (
                                <Badge bg="warning" className="flex-fill text-center py-1">
                                  {emp.expiringDocs} Expiring
                                </Badge>
                              )}
                            </div>
                            {(emp.expiredDocs > 0 || emp.missingMandatory.length > 0) && (
                              <div className="d-flex gap-1">
                                {emp.expiredDocs > 0 && (
                                  <Badge bg="danger" className="flex-fill text-center py-1">
                                    {emp.expiredDocs} Expired
                                  </Badge>
                                )}
                                {emp.missingMandatory.length > 0 && (
                                  <Badge bg="danger" className="flex-fill text-center py-1">
                                    {emp.missingMandatory.length} Missing
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
            </Row>
          </Card.Body>
        </Card>
      )}

      {selectedStore && (
        <div className="employee-detail-overlay" onClick={() => setSelectedStore(null)}>
        <Card className="employee-detail-modal border-0 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <Card.Header className="bg-gradient-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <StoreIcon className="me-2" size={20} />
              {selectedStore} - Employee Details
            </h5>
             <button 
              className="btn btn-sm btn-light"
              onClick={() => setSelectedStore(null)}
            >
              ✕ Close
            </button>
          </Card.Header>
          
         <Card.Body>
            {dashboardData.employeeWiseData.filter(emp => emp.store === selectedStore).length === 0 ? (
              <div className="text-center text-muted py-5">
                <Users size={48} className="mb-3 opacity-50" />
                <p>No employees found for this store</p>
              </div>
            ) : (
              <Row>
              <center>
                {dashboardData.employeeWiseData
                  .filter(emp => emp.store === selectedStore)
                  .sort((a, b) => b.missingMandatory.length - a.missingMandatory.length)
                  .map((emp, idx) => {
                    const isCompliant = emp.missingMandatory.length === 0 && emp.expiredDocs === 0;
                    return (
                      <Col md={7} lg={8} key={idx} className="mb-13">
                        <Card 
                          className="employee-card h-100 border-0 shadow-sm"
                          onClick={() => setSelectedEmployee(emp)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                               <h6 className="mb-0 fw-bold">{emp.employeeName}</h6>
                                <small className="text-muted">{emp.employeeId}</small>
                              </div>
                              {isCompliant ? (
                                <Badge bg="success" className="d-flex align-items-center">
                                  <CheckCircle size={12} className="me-1" />
                                  Compliant
                                </Badge>
                              ) : (
                                <Badge bg="warning" className="d-flex align-items-center">
                                  <AlertTriangle size={12} className="me-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            
                            <div className="employee-stats">
                              <div className="stat-item">
                                <FileText size={16} className="text-primary me-2" />
                                <span className="stat-text">{emp.totalDocs} Total Document</span>
                              </div>
                              <div className="stat-item">
                                <CheckCircle size={16} className="text-success me-2" />
                                <span className="stat-text">{emp.validDocs} Valid</span>
                              </div>
                              {emp.expiringDocs > 0 && (
                                <div className="stat-item">
                                  <Clock size={16} className="text-warning me-2" />
                                  <span className="stat-text">{emp.expiringDocs} Expiring</span>
                                </div>
                              )}
                              {emp.expiredDocs > 0 && (
                                <div className="stat-item">
                                  <XCircle size={16} className="text-danger me-2" />
                                  <span className="stat-text">{emp.expiredDocs} Expired</span>
                                </div>
                              )}
                              {emp.missingMandatory.length > 0 && (
                                <div className="stat-item">
                                  <AlertCircle size={16} className="text-danger me-2" />
                                  <span className="stat-text">{emp.missingMandatory.length} Missing</span>
                                </div>
                              )}
                            </div>
                           </Card.Body>
                         </Card>
                      </Col>
                    );
                  })}
                 </center>
              </Row>
            )}
          </Card.Body>
        </Card>
        </div>
      )}

      {selectedEmployee && (
        <div className="employee-detail-overlay" onClick={() => setSelectedEmployee(null)}>
          <Card 
            className="employee-detail-modal border-0 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card.Header className="bg-gradient-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{selectedEmployee.employeeName}</h5>
                <small className="opacity-75">{selectedEmployee.employeeId} • {selectedEmployee.store}</small>
              </div>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => setSelectedEmployee(null)}
              >
               ✕ Close
              </button>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <FileText size={24} className="text-primary mb-2" />
                    <div className="h4 mb-0">{selectedEmployee.totalDocs}</div>
                    <small className="text-muted">Total Docs</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <CheckCircle size={24} className="text-success mb-2" />
                    <div className="h4 mb-0">{selectedEmployee.validDocs}</div>
                    <small className="text-muted">Valid</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <Clock size={24} className="text-warning mb-2" />
                    <div className="h4 mb-0">{selectedEmployee.expiringDocs}</div>
                    <small className="text-muted">Expiring</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <XCircle size={24} className="text-danger mb-2" />
                    <div className="h4 mb-0">{selectedEmployee.expiredDocs}</div>
                    <small className="text-muted">Expired</small>
                  </div>
                </Col>
              </Row>

              {selectedEmployee.missingMandatory.length > 0 && (
                <Alert variant="danger" className="mb-3">
                  <AlertTriangle className="me-2" size={18} />
                  <strong>Missing Mandatory Documents:</strong>
                  <ul className="mb-0 mt-2">
                    {selectedEmployee.missingMandatory.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <h6 className="mb-3">
                <FileText className="me-2" size={18} />
                Uploaded Documents
              </h6>
              {selectedEmployee.documents.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Document Category</th>
                        <th>Document Name</th>
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.documents.map((doc, idx) => (
                        <tr key={idx}>
                          <td>{doc.documentType}</td>
                          <td>{doc.documentName || 'N/A'}</td>
                          <td>
                            <Calendar size={14} className="me-1" />
                            {formatDate(doc.issueDate)}
                          </td>
                          <td>
                            <Calendar size={14} className="me-1" />
                            {formatDate(doc.expiryDate)}
                          </td>
                          <td>
                            {doc.status === 'valid' && (
                              <Badge bg="success">
                                <CheckCircle size={12} className="me-1" />
                                Valid
                              </Badge>
                            )}
                            {doc.status === 'expiring' && (
                              <Badge bg="warning">
                                <Clock size={12} className="me-1" />
                                Expiring Soon
                              </Badge>
                            )}
                            {doc.status === 'expired' && (
                              <Badge bg="danger">
                                <XCircle size={12} className="me-1" />
                                Expired
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  <AlertCircle className="me-2" size={18} />
                  No documents uploaded yet for this employee.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard;
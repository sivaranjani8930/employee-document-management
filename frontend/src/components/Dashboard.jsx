import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Modal, Card, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  Upload, 
  Search, 
  FileText, 
  LogOut, 
  User,
  Settings,
  Clock,
  Calendar,
  Shield,
  BarChart3
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import DocumentRetrieval from './DocumentRetrieval';
import LetterTemplates from './LetterTemplates';
import CategoryManagement from './CategoryManagement';
import ExpiryDashboard from './ExpiryDashboard';
import ComplianceDashboard from './ComplianceDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState('compliance-dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Auto logout state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 60 * 1000; // 1 minute warning

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAutoLogout = useCallback(() => {
    logout();
    toast.warning('You have been logged out due to inactivity', {
      position: 'top-right',
      autoClose: 3000
    });
    navigate('/login');
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Hide warning modal if showing
    setShowWarningModal(false);
    setRemainingTime(60);

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set warning timer (9 minutes)
    warningTimerRef.current = setTimeout(() => {
      setShowWarningModal(true);
      setRemainingTime(60);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set logout timer (1 minute after warning)
      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, WARNING_TIME);
    }, IDLE_TIMEOUT - WARNING_TIME);
  }, [handleAutoLogout]);

  // Setup auto logout
  useEffect(() => {
    resetTimers();

    // Activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimers();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers]);

  const handleContinueSession = () => {
    resetTimers();
  };

  const handleLogout = () => {
    // Clear all timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    logout();
    toast.success('Successfully Logged Out', {
      position: 'top-right',
      autoClose: 2000
    });
    setTimeout(() => {
      navigate('/login');
    }, 1000);
    setShowLogoutModal(false);
  };

  const menuItems = [
    
    { 
      id: 'upload', 
      label: 'Document Upload', 
      icon: Upload
    },
    { 
      id: 'search', 
      label: 'Document Retrieval & Search', 
      icon: Search
    },
    {
      id: 'compliance-dashboard',
      label: 'Compliance Dashboard',
      icon: BarChart3
    },
    {
      id: 'expiry-tracking',
      label: 'Expiry Tracking System',
      icon: Clock
    },
    { 
      id: 'templates', 
      label: 'Letter Templates & Printing', 
      icon: FileText
    },
    { 
      id: 'categories', 
      label: 'Category Management', 
      icon: Settings
    },
    
  ];

 

  const renderContent = () => {
    switch (activeMenu) {
      case 'compliance-dashboard':
        return <ComplianceDashboard />;
      case 'upload':
        return <DocumentUpload />;
      case 'search':
        return <DocumentRetrieval />;
      case 'expiry-tracking':
        return <ExpiryDashboard />;
      case 'templates':
        return <LetterTemplates />;
      case 'categories':
        return <CategoryManagement />;
     
      default:
        return <ComplianceDashboard />;
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar bg="primary" variant="dark" className="dashboard-header">
        <Container fluid>
          <Navbar.Brand className="dashboard-brand">
            <FileText size={28} className="me-2" />
            Centralized Employee Document Management System
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <div className="user-info me-3">
              <User size={20} className="me-2" />
              <span>{user?.name || 'HR User'}</span>
            </div>
            <Button
              variant="outline-light"
              onClick={() => setShowLogoutModal(true)}
              className="logout-btn"
            >
              <LogOut size={18} className="me-2" />
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <div className="dashboard-body">
        <div className="dashboard-sidebar">
          <Card className="info-card mb-3 mx-3 mt-3">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center mb-3">
                <div className="user-avatar me-3">
                  <User size={32} />
                </div>
                <div>
                  <h6 className="mb-0">{user?.name || 'HR User'}</h6>
                  <small className="text-muted">{user?.role || 'HR'} Role</small>
                </div>
              </div>
              <div className="datetime-section">
                <div className="d-flex align-items-center mb-2">
                  <Calendar size={14} className="me-2 text-primary" />
                  <small className="fw-bold">
                    {currentDateTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </small>
                </div>
                <div className="d-flex align-items-center">
                  <Clock size={14} className="me-2 text-primary" />
                  <small className="fw-bold">
                    {currentDateTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true 
                    })}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Nav className="flex-column sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <Nav.Link
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <div className="d-flex align-items-center">
                    <Icon size={18} className="me-2" />
                    <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                  </div>
                </Nav.Link>
              );
            })}
          </Nav>
        </div>

        <div className="dashboard-content">
          <Container fluid className="py-4">
            {renderContent()}
          </Container>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to logout?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Auto Logout Warning Modal */}
      <Modal 
        show={showWarningModal} 
        onHide={() => {}} 
        backdrop="static" 
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Session Timeout Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Clock size={48} className="text-warning mb-3" />
            <p>Your session will expire in:</p>
            <h2 className="text-danger">{remainingTime} seconds</h2>
            <p className="text-muted">Click "Continue" to stay logged in</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleContinueSession}>
            Continue Session
          </Button>
          <Button variant="secondary" onClick={handleAutoLogout}>
            Logout Now
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;
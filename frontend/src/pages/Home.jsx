import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="modern-home-container">
      {/* Animated Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="glass-card">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
        </div>

        <h1 className="modern-title">
          <span>Centralized Employee</span>
          <span className="highlight-text">Document Management</span>
        </h1>

        <p className="modern-subtitle">
          Secure, fast, and centralized HR document automation for modern teams.
        </p>

        <div className="action-container">
          <button
            className="modern-primary-btn"
            onClick={() => navigate('/login')}
          >
            <span>Proceed to Login</span>
            <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        <div className="features-row">
          <div className="feature-item">
            <span className="feature-icon">🔒</span> Secure
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span> Fast
          </div>
          <div className="feature-item">
            <span className="feature-icon">📁</span> Centralized
          </div>
        </div>
      </div>

      <footer className="modern-footer">
        <p>&copy; {new Date().getFullYear()} Centralized Employee Document Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
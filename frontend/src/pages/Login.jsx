import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { User, Lock } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    role: 'HR',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = login(formData.username, formData.password, formData.role);

    if (result.success) {
      toast.success(result.message, {
        position: 'top-right',
        autoClose: 2000
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      toast.error(result.message, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  return (
    <div className="login-container">
      <Container className="login-wrapper">
        <Card className="login-card">
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <div className="login-icon">
                <User size={48} />
              </div>
              <h2 className="login-title">Login</h2>
              <p className="text-muted">Enter your credentials to access the system</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control-lg"
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Store Manager">Store Manager</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <div className="input-with-icon">
                  <User className="input-icon" size={20} />
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="form-control-lg"
                    isInvalid={!!errors.username}
                  />
                </div>
                {errors.username && (
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={20} />
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="form-control-lg"
                    isInvalid={!!errors.password}
                  />
                </div>
                {errors.password && (
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 login-btn"
                size="lg"
              >
                Login
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Login;
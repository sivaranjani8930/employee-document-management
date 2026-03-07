import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Modal, Badge } from 'react-bootstrap';
import { Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getCategories, addCategory } from '../api';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error('Error loading categories', {
        position: 'top-right',
        autoClose: 3000
      });
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      if (editingCategory) {
        toast.info('Update functionality coming soon', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        await addCategory(formData);
        toast.success('Category added successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        loadCategories();
        handleClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving category', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      toast.info('Delete functionality coming soon', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  return (
    <div className="category-management">
      <Card className="category-card">
        <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <Settings className="me-2" size={24} />
            Category Management
          </h3>
          <Button
            variant="primary"
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '' });
              setShowModal(true);
            }}
          >
            <Plus size={18} className="me-1" />
            Add Category
          </Button>
        </Card.Header>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No categories found. Add your first category!
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., ID Proof, Driving License"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
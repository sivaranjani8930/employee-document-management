import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Modal, Badge } from 'react-bootstrap';
import { FileText, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { getTemplates, createTemplate, updateTemplate } from '../api';
import './TemplateEditor.css';

const TemplateEditor = ({ show, onHide, templateId, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    variables: []
  });
  const [loading, setLoading] = useState(false);

  const loadTemplate = useCallback(async () => {
    try {
      const response = await getTemplates();
      if (response.data && response.data.data) {
        const template = response.data.data.find(t => t.id === templateId);
        if (template) {
          setFormData({
            name: template.name,
            content: template.content,
            variables: template.variables || []
          });
        }
      }
    } catch (error) {
      toast.error('Error loading template', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  }, [templateId]);

  useEffect(() => {
    if (show && templateId) {
      loadTemplate();
    } else if (show) {
      setFormData({ name: '', content: '', variables: [] });
    }
  }, [show, templateId, loadTemplate]);

  const extractVariables = (content) => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    const variables = extractVariables(content);
    setFormData({ ...formData, content, variables });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Name and content are required', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    setLoading(true);
    try {
      if (templateId) {
        await updateTemplate(templateId.replace('T', ''), formData);
        toast.success('Template updated successfully', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        await createTemplate(formData);
        toast.success('Template created successfully', {
          position: 'top-right',
          autoClose: 3000
        });
      }
      if (onSave) onSave();
      onHide();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving template', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newContent = before + `{{${variable}}}` + after;
    setFormData({ ...formData, content: newContent, variables: extractVariables(newContent) });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FileText className="me-2" size={20} />
          {templateId ? 'Edit Template' : 'Create New Template'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Template Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Warning Letter, Offer Letter"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Available Variables</Form.Label>
            <div className="variables-panel mb-2">
              {['Date', 'EmployeeName', 'Store', 'Position', 'JoiningDate', 'Salary', 'ReportingManager'].map(variable => (
                <Badge
                  key={variable}
                  bg="info"
                  className="variable-badge me-2 mb-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                </Badge>
              ))}
            </div>
            <small className="text-muted">Click on a variable to insert it into the template</small>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Template Content <span className="text-danger">*</span></Form.Label>
            <Form.Control
              id="template-content"
              as="textarea"
              rows={15}
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Enter template content. Use {{VariableName}} for placeholders."
              required
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
            <Form.Text className="text-muted">
              Detected variables: {formData.variables.length > 0 ? formData.variables.join(', ') : 'None'}
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <Save size={16} className="me-1" />
              {loading ? 'Saving...' : templateId ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TemplateEditor;
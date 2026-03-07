import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';
import { FileText, Edit2, Download, Plus, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { getTemplates, getEmployees } from '../api';
import jsPDF from 'jspdf';
import TemplateEditor from './TemplateEditor';
import './LetterTemplates.css';

const LetterTemplates = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadEmployees();
    loadTemplates();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response.data && response.data.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getTemplates();
      if (response.data && response.data.data) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const replaceVariables = (template, employee) => {
    if (!employee) return template.content;

    let content = template.content;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    content = content.replace(/{{Date}}/g, today);
    content = content.replace(/{{EmployeeName}}/g, employee.name);
    content = content.replace(/{{Store}}/g, employee.store);
    content = content.replace(/{{Position}}/g, employee.position || employee.role);
    content = content.replace(/{{JoiningDate}}/g, employee.joiningDate || 'TBD');
    content = content.replace(/{{Salary}}/g, employee.salary || 'As per company policy');
    content = content.replace(/{{ReportingManager}}/g, employee.reportingManager || 'Store Manager');

    return content;
  };

  const handleGeneratePDF = (template) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    const content = replaceVariables(template, selectedEmployee);
    
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(content, 180);
    
    pdf.setFontSize(12);
    pdf.text(lines, 15, 20);
    
    const fileName = `${template.name}_${selectedEmployee.name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    
    toast.success('Letter generated and downloaded successfully!', {
      position: 'top-right',
      autoClose: 3000
    });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template.id);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handlePrint = (template) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    const content = replaceVariables(template, selectedEmployee);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="letter-templates">
      <Card className="templates-card">
        <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <FileText className="me-2" size={24} />
            Letter Templates & Printing
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTemplate}
          >
            <Plus size={18} className="me-1" />
            New Template
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Employee Selection */}
          <Card className="employee-select-card mb-4">
            <Card.Body>
              <Form.Label className="fw-bold mb-3">Select Employee for Auto-fill</Form.Label>
              <Form.Select
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const emp = employees.find(emp => emp.id === e.target.value);
                  setSelectedEmployee(emp || null);
                }}
                size="lg"
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.id} ({emp.store})
                  </option>
                ))}
              </Form.Select>
              {selectedEmployee && (
                <div className="mt-3 p-3 bg-light rounded">
                  <strong>Selected:</strong> {selectedEmployee.name} ({selectedEmployee.id}) - {selectedEmployee.store}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Templates Grid */}
          <div className="row g-4">
            {templates.map(template => {
              const filledContent = replaceVariables(template, selectedEmployee);
              const hasPlaceholders = filledContent.includes('{{');
              
              return (
                <div key={template.id} className="col-md-6">
                  <Card className="template-card h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 className="mb-1">{template.name}</h4>
                          <Badge bg="secondary">ID: {template.id}</Badge>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="edit-btn"
                        >
                          <Edit2 size={16} className="me-1" />
                          Edit
                        </Button>
                      </div>

                      {/* Variables */}
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">Variables:</small>
                        <div className="variables-container">
                          {template.variables.map(variable => (
                            <Badge key={variable} bg="info" className="variable-badge">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="template-preview mb-3">
                        <small className="text-muted d-block mb-2">Preview:</small>
                        <div className="preview-content">
                          {filledContent.split('\n').slice(0, 8).map((line, idx) => (
                            <div key={idx} className="preview-line">
                              {line || '\u00A0'}
                            </div>
                          ))}
                          {filledContent.split('\n').length > 8 && (
                            <div className="text-muted small">...</div>
                          )}
                        </div>
                      </div>

                      {hasPlaceholders && selectedEmployee && (
                        <div className="alert alert-warning small mb-3">
                          Some placeholders remain unfilled. Please ensure all employee data is complete.
                        </div>
                      )}

                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          className="flex-fill generate-btn"
                          onClick={() => handleGeneratePDF(template)}
                          disabled={!selectedEmployee}
                        >
                          <Download className="me-2" size={18} />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline-primary"
                          onClick={() => handlePrint(template)}
                          disabled={!selectedEmployee}
                          title="Print"
                        >
                          <Printer size={18} />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      <TemplateEditor
        show={showEditor}
        onHide={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
        templateId={editingTemplate}
        onSave={loadTemplates}
      />
    </div>
  );
};

export default LetterTemplates;
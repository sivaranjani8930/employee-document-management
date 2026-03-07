import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateDocument } from '../api';

const UpdateDocumentModal = ({ show, onHide, documentId, onUpdated }) => {
  const [file, setFile] = useState(null);
  const [reason, setReason] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Auto-fill issue date when modal opens
  useEffect(() => {
    if (show) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      setIssueDate(todayString);
    }
  }, [show]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinExpiryDate = () => {
    if (!issueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    const issue = new Date(issueDate);
    issue.setDate(issue.getDate() + 1);
    return issue.toISOString().split('T')[0];
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        // Clear file error
        if (errors.file) {
          setErrors(prev => ({
            ...prev,
            file: ''
          }));
        }
      } else {
        toast.error('Invalid file type. Please upload PDF, DOCX, JPG, or PNG', {
          position: 'top-right',
          autoClose: 3000
        });
        e.target.value = '';
      }
    }
  };

  const handleIssueDateChange = (e) => {
    const newIssueDate = e.target.value;
    setIssueDate(newIssueDate);
    
    // Clear issue date error
    if (errors.issueDate) {
      setErrors(prev => ({
        ...prev,
        issueDate: ''
      }));
    }
    
    if (expiryDate && newIssueDate) {
      const issue = new Date(newIssueDate);
      const expiry = new Date(expiryDate);
      if (expiry <= issue) {
        setExpiryDate('');
        toast.warning('Expiry date must be after issue date. Please select a new expiry date.', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    }
  };

  const handleExpiryDateChange = (e) => {
    setExpiryDate(e.target.value);
    
    // Clear expiry date error
    if (errors.expiryDate) {
      setErrors(prev => ({
        ...prev,
        expiryDate: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    if (!issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    
    if (!expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    
    if (issueDate && expiryDate) {
      const issue = new Date(issueDate);
      const expiry = new Date(expiryDate);
      
      if (expiry <= issue) {
        newErrors.expiryDate = 'Expiry date must be after issue date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields correctly', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (reason.trim()) {
        formData.append('reason', reason.trim());
      } else {
        formData.append('reason', 'Document updated');
      }

      formData.append('issueDate', issueDate);
      formData.append('expiryDate', expiryDate);

      await updateDocument(documentId, formData);
      
      toast.success('Document updated successfully', {
        position: 'top-right',
        autoClose: 3000
      });
      
      setFile(null);
      setReason('');
      setIssueDate('');
      setExpiryDate('');
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onUpdated) {
        onUpdated();
      }
      
      onHide();
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update document';
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFile(null);
      setReason('');
      setIssueDate('');
      setExpiryDate('');
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop={isSubmitting ? 'static' : true}>
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>
          <Upload className="me-2" size={20} />
          Update Document
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <small>
              <strong>Note:</strong> Uploading a new file will create a new version. 
              The previous version will be archived in the version history.
            </small>
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label>
              New File <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
              disabled={isSubmitting}
              isInvalid={!!errors.file}
            />
            {file ? (
              <Form.Text className="text-success d-block">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Form.Text>
            ) : null}
            {errors.file ? (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.file}
              </Form.Control.Feedback>
            ) : (
              <Form.Text className="text-muted d-block mt-1">
                Supported formats: PDF, DOCX, JPG, PNG (Max 10MB)
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Issue Date <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              value={issueDate}
              onChange={handleIssueDateChange}
              min={getTodayDate()}
              max={getTodayDate()}
              disabled={isSubmitting}
              required
              isInvalid={!!errors.issueDate}
            />
            {errors.issueDate ? (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.issueDate}
              </Form.Control.Feedback>
            ) : (
              <Form.Text className="text-muted">
                Auto-filled with today's date
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Expiry Date <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              min={getMinExpiryDate()}
              disabled={isSubmitting || !issueDate}
              required
              isInvalid={!!errors.expiryDate}
            />
            {errors.expiryDate ? (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.expiryDate}
              </Form.Control.Feedback>
            ) : (
              <Form.Text className="text-muted">
                {issueDate 
                  ? 'Must be after issue date' 
                  : 'Please select issue date first'}
              </Form.Text>
            )}
          </Form.Group>

          {issueDate && expiryDate && new Date(issueDate) >= new Date(expiryDate) && !errors.expiryDate && (
            <Alert variant="warning" className="mb-3">
              <small>⚠️ Issue date should be before expiry date</small>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Reason for Update (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for updating this document (e.g., 'Renewed license', 'Document expired - uploading new version')"
              disabled={isSubmitting}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {reason.length}/500 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UpdateDocumentModal;
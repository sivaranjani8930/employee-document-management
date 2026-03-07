import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Form, Button, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadDocument, getEmployees, getCategories } from '../api';
import './DocumentUpload.css';

const DocumentUpload = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    store: '',
    documentType: '',
    issueDate: '',
    expiryDate: '',
    remarks: ''
  });
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const fileInputRef = useRef(null);
  const cardBodyRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    loadEmployees();
    loadCategories();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      issueDate: todayString
    }));
  }, []);

  // Add scroll listener for sticky header effect
  useEffect(() => {
    const cardBody = cardBodyRef.current;
    if (!cardBody) return;

    const handleScroll = () => {
      setIsScrolled(cardBody.scrollTop > 10);
    };

    cardBody.addEventListener('scroll', handleScroll);
    return () => cardBody.removeEventListener('scroll', handleScroll);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response.data && response.data.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Error loading employees', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      if (response.data && response.data.data) {
        setDocumentTypes(response.data.data.map(cat => cat.name));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setDocumentTypes([
        'ID Proof',
        'Driving License',
        'Medical Certificate',
        'Training Certificate',
        'Employment Contract',
        'Educational Certificate',
        'Address Proof',
        'Police Verification'
      ]);
    }
  };

  const stores = [
    'Station Alpha', 'Station Beta', 'Store Gamma', 'Station Delta', 'Store Epsilon',
    'Station Zeta', 'Station Eta', 'Station Theta', 'Station Iota', 'Station Kappa'
  ];

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinExpiryDate = () => {
    if (!formData.issueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    const issueDate = new Date(formData.issueDate);
    issueDate.setDate(issueDate.getDate() + 1);
    return issueDate.toISOString().split('T')[0];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (name === 'employeeName' && value) {
      const selectedEmployee = employees.find(emp => emp.name === value);
      if (selectedEmployee) {
        setFormData(prev => ({
          ...prev,
          employeeName: value,
          employeeId: selectedEmployee.id,
          store: selectedEmployee.store || prev.store
        }));
        return;
      }
    }
    
    if (name === 'issueDate' || name === 'documentType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        expiryDate: ''
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (selectedFiles) => {
    if (!formData.documentType) {
      toast.warning('Please select a document type first', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    if (!formData.issueDate || !formData.expiryDate) {
      toast.warning('Please select issue date and expiry date first', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    const fileArray = Array.from(selectedFiles);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = fileArray.filter(file => {
      if (validTypes.includes(file.type)) {
        return true;
      } else {
        toast.error(`Invalid file type: ${file.name}. Please upload PDF, DOCX, JPG, or PNG`, {
          position: 'top-right',
          autoClose: 3000
        });
        return false;
      }
    });
    
    const newFiles = validFiles.map(file => ({
      file: file,
      documentType: formData.documentType,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      remarks: formData.remarks
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    if (validFiles.length > 0 && errors.files) {
      setErrors(prev => ({
        ...prev,
        files: ''
      }));
    }

    toast.success(`${validFiles.length} file(s) added to upload queue`, {
      position: 'top-right',
      autoClose: 2000
    });
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    const removedFile = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast.info(`Removed: ${removedFile.file.name}`, {
      position: 'top-right',
      autoClose: 2000
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    
    if (!formData.employeeName) {
      newErrors.employeeName = 'Employee name is required';
    }
    
    if (!formData.store) {
      newErrors.store = 'Please select a store';
    }
    
    if (files.length === 0) {
      newErrors.files = 'Please add at least one file to upload';
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

    setIsUploading(true);
    setUploadProgress(0);
    setShowResults(false);
    
    const results = [];
    const totalFiles = files.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('file', fileData.file);
        formDataToSend.append('employeeId', formData.employeeId);
        formDataToSend.append('documentType', fileData.documentType);
        formDataToSend.append('issueDate', fileData.issueDate);
        formDataToSend.append('expiryDate', fileData.expiryDate);
        if (fileData.remarks) formDataToSend.append('remarks', fileData.remarks);
        
        const uploader = (user?.name || user?.username) || 'System';
        formDataToSend.append('uploadedBy', uploader);
        formDataToSend.append('reason', fileData.remarks || 'Initial upload');
        
        const response = await uploadDocument(formDataToSend);
        
        successCount++;
        results.push({
          fileName: fileData.file.name,
          documentType: fileData.documentType,
          status: 'success',
          message: 'Uploaded successfully',
          documentId: response.data?.data?.id
        });
        
      } catch (error) {
        failCount++;
        results.push({
          fileName: fileData.file.name,
          documentType: fileData.documentType,
          status: 'error',
          message: error.response?.data?.message || error.message || 'Upload failed'
        });
        console.error(`Error uploading ${fileData.file.name}:`, error);
      }
      
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setIsUploading(false);
    setUploadResults(results);
    setShowResults(true);

    if (successCount === totalFiles) {
      toast.success(`All ${totalFiles} document(s) uploaded successfully!`, {
        position: 'top-right',
        autoClose: 3000
      });
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${totalFiles} document(s) uploaded. ${failCount} failed.`, {
        position: 'top-right',
        autoClose: 4000
      });
    } else {
      toast.error(`All ${totalFiles} upload(s) failed`, {
        position: 'top-right',
        autoClose: 3000
      });
    }

    if (successCount === totalFiles) {
      const todayString = getTodayDate();
      setFormData({
        employeeId: '',
        employeeName: '',
        store: '',
        documentType: '',
        issueDate: todayString,
        expiryDate: '',
        remarks: ''
      });
      setFiles([]);
      setUploadProgress(0);
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setShowResults(false);
        setUploadResults([]);
      }, 5000);
    }
  };

  return (
    <div className="document-upload">
      <Card className="upload-card">
        <Card.Header className={`sticky-header ${isScrolled ? 'scrolled' : ''}`}>
          <h3 className="mb-0 d-flex align-items-center">
            <Upload className="me-2" size={24} />
            Document Upload 
          </h3>
        </Card.Header>
        <Card.Body ref={cardBodyRef}>
          {showResults && uploadResults.length > 0 && (
            <Alert variant={uploadResults.every(r => r.status === 'success') ? 'success' : 'warning'} className="mb-4">
              <h5 className="mb-3">Upload Results:</h5>
              <div className="upload-results">
                {uploadResults.map((result, idx) => (
                  <div key={idx} className="d-flex align-items-start mb-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="text-success me-2 mt-1" size={18} />
                    ) : (
                      <X className="text-danger me-2 mt-1" size={18} />
                    )}
                    <div className="flex-grow-1">
                      <div>
                        <strong>{result.fileName}</strong>
                        <Badge bg="secondary" className="ms-2">{result.documentType}</Badge>
                      </div>
                      <span className={result.status === 'success' ? 'text-success' : 'text-danger'}>
                        {result.message}
                      </span>
                      {result.documentId && (
                        <Badge bg="info" className="ms-2">ID: {result.documentId}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <Form.Label>Employee Name<span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  required
                  isInvalid={!!errors.employeeName}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </Form.Select>
                {errors.employeeName && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.employeeName}
                  </Form.Control.Feedback>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Employee ID <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="Auto-filled when employee is selected"
                  required
                  readOnly
                  style={{ backgroundColor: '#f8f9fa' }}
                  isInvalid={!!errors.employeeId}
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Store <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  required
                  isInvalid={!!errors.store}
                >
                  <option value="">Select Store</option>
                  {stores.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </Form.Select>
                {errors.store && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.store}
                  </Form.Control.Feedback>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Document Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Document Type</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Issue Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  max={getTodayDate()}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Expiry Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={getMinExpiryDate()}
                  disabled={!formData.issueDate}
                  required
                />
              </div>
              <div className="col-md-12 mb-1">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any additional remarks"
                />
              </div>
            </div>

            <div className="mb-1">
              <Form.Label>
                Add Files <span className="text-danger">*</span>
                {files.length > 0 && (
                  <Badge bg="primary" className="ms-2">{files.length} file(s) selected</Badge>
                )}
              </Form.Label>
              <div
                className={`drag-drop-area ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-file' : ''} ${errors.files ? 'is-invalid' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  multiple
                  className="d-none"
                />
                {files.length > 0 ? (
                  <div className="files-list">
                    {files.map((fileData, index) => (
                      <div key={index} className="file-preview-item">
                        <File size={20} className="text-primary me-2 flex-shrink-0" />
                        <div className="flex-grow-1 file-info">
                          <div className="file-name">{fileData.file.name}</div>
                          <div className="file-meta">
                            <Badge bg="secondary" className="me-2">{fileData.documentType}</Badge>
                            <span className="file-size">({(fileData.file.size / 1024).toFixed(2)} KB)</span>
                          </div>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="remove-file-btn"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2"
                      disabled={!formData.documentType || !formData.issueDate || !formData.expiryDate}
                    >
                      <Upload size={16} className="me-1" />
                      Add More Files
                    </Button>
                  </div>
                ) : (
                  <div className="drag-drop-content">
                    <Upload size={18} className="text-muted mb-1" />
                    <p className="mb-1">Click to upload or drag and drop</p>
                  </div>
                )}
              </div>
              {errors.files && (
                <div className="text-danger small mt-1">{errors.files}</div>
              )}
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Uploading {files.length} file(s)...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar now={uploadProgress} animated striped variant="primary" />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-100 upload-submit-btn"
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? `Uploading...` : `Upload Document${files.length > 1 ? 's' : ''}`}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DocumentUpload;
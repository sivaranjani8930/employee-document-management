import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { downloadDocument, downloadVersion } from '../api';
import { toast } from 'react-toastify';
import './DocumentPreview.css';

const DocumentPreview = ({ show, onHide, document }) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(1);

  const loadPreview = useCallback(async () => {
    if (!document?.id) return;
    
    setLoading(true);
    try {
      let response;
      if (document.id.startsWith('VERSION') && document.versionId) {
        response = await downloadVersion(document.versionId);
      } else {
        response = await downloadDocument(document.id.replace('DOC', ''));
      }
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: response.headers?.['content-type'] });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      toast.error('Error loading document preview', {
        position: 'top-right',
        autoClose: 3000
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (show && document) {
      loadPreview();
    } else {
      setPreviewUrl(null);
      setZoom(1);
    }
  }, [show, document, loadPreview]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDownload = async () => {
    if (!document.id) return;
    
    try {
      const response = await downloadDocument(document.id.replace('DOC', ''));
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: response.headers?.['content-type'] });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document?.fileName || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error) {
      toast.error('Error downloading document', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const isImage = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(ext);
  };

  const isPDF = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ext === 'pdf';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="document-preview-modal">
      <Modal.Header closeButton>
        <Modal.Title>
         <p className="mt-1">DOCUMENT PREVIEW ({document?.fileName || 'Document Preview'})</p>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading document...</p>
          </div>
        ) : previewUrl ? (
          <div className="preview-container">
            <div className="preview-controls mb-1.5">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut size={14} />
              </Button>
              <span className="mx-2">{(zoom * 100).toFixed(0)}%</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                disabled={zoom >= 2}
              >
                <ZoomIn size={14} />
              </Button>
              
            </div>
            <div className="preview-content" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {isImage(document?.fileName) ? (
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="preview-image"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : isPDF(document?.fileName) ? (
                <iframe
                  src={previewUrl}
                  className="preview-iframe"
                  title="PDF Preview"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              ) : (
                <div className="text-center py-5">
                  <p>Preview not available for this file type.</p>
                  <Button variant="primary" onClick={handleDownload}>
                    <Download size={16} className="me-1" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <p>No preview available</p>
          </div>
        )}
      </Modal.Body>
     
    </Modal>
  );
};

export default DocumentPreview;
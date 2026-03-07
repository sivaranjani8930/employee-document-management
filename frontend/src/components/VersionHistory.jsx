import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { History, Eye, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { getDocumentVersions, downloadVersion } from '../api';
import DocumentPreview from './DocumentPreview';
import './VersionHistory.css';

const VersionHistory = ({ documentId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (documentId) {
      loadVersions();
    } else {
      setVersions([]);
    }
  }, [documentId]);

  const loadVersions = async () => {
    if (!documentId) {
      setVersions([]);
      return;
    }
    
    setLoading(true);
    try {
      let docId = documentId;
      if (typeof documentId === 'string') {
        if (documentId.startsWith('DOC')) {
          docId = parseInt(documentId.replace('DOC', ''), 10);
        } else {
          docId = parseInt(documentId, 10);
        }
      }
      
      if (isNaN(docId) || docId <= 0) {
        console.error('Invalid document ID:', documentId);
        setVersions([]);
        setLoading(false);
        return;
      }
      
      const response = await getDocumentVersions(docId);
      if (response.data && response.data.data) {
        // Map versions and change "System" to "HR User"
        const mappedVersions = response.data.data.map(version => ({
          ...version,
          uploadedBy: version.uploadedBy === 'System' ? 'HR User' : (version.uploadedBy || 'HR User')
        }));
        setVersions(mappedVersions);
      } else {
        setVersions([]);
      }
    } catch (error) {
      console.error('Version history error:', error);
      console.error('Document ID received:', documentId);
      if (error.response?.status === 404) {
        setVersions([]);
      } else if (error.response?.status === 500) {
        toast.error('Server error loading version history', {
          position: 'top-right',
          autoClose: 3000
        });
        setVersions([]);
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        console.error('Error details:', errorMsg);
        toast.error('Error loading version history', {
          position: 'top-right',
          autoClose: 3000
        });
        setVersions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = (version) => {
    if (version.id === 0) {
      setPreviewDocument({
        id: `DOC${version.documentId}`,
        fileName: version.fileName
      });
    } else {
      setPreviewDocument({
        id: `VERSION${version.id}`,
        fileName: version.fileName,
        versionId: version.id
      });
    }
    setShowPreview(true);
  };

  const handleDownload = async (version) => {
    try {
      if (version.id === 0) {
        toast.info('Use the main download button for current version', {
          position: 'top-right',
          autoClose: 3000
        });
        return;
      }
      
      const response = await downloadVersion(version.id);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: response.headers?.['content-type'] });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = version.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Version downloaded successfully', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (error) {
      toast.error('Error downloading version', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  return (
    <Card className="version-history-card">
      <Card.Header className="d-flex align-items-center">
        <History className="me-2" size={20} />
        <strong>Version History</strong>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted">Loading version history...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <p>No version history available</p>
          </div>
        ) : (
          <Table hover responsive>
            <thead>
              <tr>
                <th>Version</th>
                <th>File Name</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(
                new Map(versions.map(v => [`${v.versionNumber}::${v.fileName}`, v])).values()
              ).map((version) => (
                <tr key={version.id}>
                  <td>
                    <Badge bg={version.versionNumber === versions[0]?.versionNumber ? 'primary' : 'secondary'}>
                      v{version.versionNumber}
                      {version.versionNumber === versions[0]?.versionNumber && ' (Current)'}
                    </Badge>
                  </td>
                  <td>{version.fileName}</td>
                  <td><strong>{version.uploadedBy}</strong></td>
                  <td>{version.uploadDate}</td>
                  <td>{version.reason || '-'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleView(version)}
                        className="action-btn"
                        title="View"
                      >
                        <Eye size={16} />
                      </Button>
                      {version.id !== 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleDownload(version)}
                          className="action-btn"
                          title="Download"
                        >
                          <Download size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      <DocumentPreview
        show={showPreview}
        onHide={() => {
          setShowPreview(false);
          setPreviewDocument(null);
        }}
        document={previewDocument}
      />
    </Card>
  );
};

export default VersionHistory;
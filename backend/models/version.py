import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_setup import db
from datetime import datetime

class DocumentVersion(db.Model):
    __tablename__ = 'document_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    uploaded_by = db.Column(db.String(100), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    reason = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'documentId': self.document_id,
            'versionNumber': self.version_number,
            'fileName': self.file_name,
            'uploadedBy': self.uploaded_by,
            'uploadDate': self.upload_date.strftime('%Y-%m-%d %H:%M:%S') if self.upload_date else None,
            'reason': self.reason
        }

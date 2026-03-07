import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_setup import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), db.ForeignKey('employees.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    issue_date = db.Column(db.DateTime)
    expiry_date = db.Column(db.DateTime)
    remarks = db.Column(db.Text)
    uploaded_by = db.Column(db.String(100), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='valid')
    version = db.Column(db.Integer, default=1)
    
    def calculate_status(self):
        if not self.expiry_date:
            return 'valid'
        today = datetime.utcnow()
        days = (self.expiry_date - today).days
        if days < 0:
            return 'expired'
        elif days <= 30:
            return 'expiring'
        return 'valid'
    
    def to_dict(self):
        return {
            'id': f'DOC{str(self.id).zfill(3)}',
            'employeeId': self.employee_id,
            'employeeName': self.employee.name if self.employee else None,
            'store': self.employee.store if self.employee else None,
            'documentType': self.document_type,
            'fileName': self.file_name,
            'issueDate': self.issue_date.strftime('%Y-%m-%d') if self.issue_date else None,
            'expiryDate': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else None,
            'remarks': self.remarks,
            'uploadedBy': self.uploaded_by,
            'uploadDate': self.upload_date.strftime('%Y-%m-%d') if self.upload_date else None,
            'status': self.status,
            'version': self.version
        }

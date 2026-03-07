from flask import Blueprint, request, send_file
from werkzeug.utils import secure_filename
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Document, Employee, DocumentVersion
from database.db_setup import db
from utils.file_handler import save_uploaded_file, allowed_file
from utils.response_helper import success_response, error_response
from datetime import datetime

document_bp = Blueprint('documents', __name__)

@document_bp.route('/upload', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return error_response('No file provided', 400)
        
        file = request.files['file']
        if file.filename == '':
            return error_response('No file selected', 400)
        
        if not allowed_file(file.filename):
            return error_response('Invalid file type', 400)
        
        employee_id = request.form.get('employeeId')
        document_type = request.form.get('documentType')
        issue_date = request.form.get('issueDate')
        expiry_date = request.form.get('expiryDate')
        remarks = request.form.get('remarks')
        uploaded_by = request.form.get('uploadedBy', 'System')
        
        if not employee_id or not document_type:
            return error_response('Employee ID and Document Type required', 400)
        
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response('Employee not found', 404)
        
        file_info = save_uploaded_file(file, employee_id)
        
        issue_date_obj = datetime.fromisoformat(issue_date) if issue_date else None
        expiry_date_obj = datetime.fromisoformat(expiry_date) if expiry_date else None
        
        document = Document(
            employee_id=employee_id,
            document_type=document_type,
            file_name=file_info['filename'],
            file_path=file_info['filepath'],
            file_size=file_info['size'],
            issue_date=issue_date_obj,
            expiry_date=expiry_date_obj,
            remarks=remarks,
            uploaded_by=uploaded_by,
            version=1
        )
        
        document.status = document.calculate_status()
        db.session.add(document)
        # flush so we have document.id before creating version record
        db.session.flush()

        # Create initial version record so history includes the first upload
        # Avoid duplicate version records for same document/version/file
        existing_init = DocumentVersion.query.filter_by(document_id=document.id, version_number=document.version, file_name=document.file_name).first()
        if not existing_init:
            initial_version = DocumentVersion(
                document_id=document.id,
                version_number=document.version,
                file_path=document.file_path,
                file_name=document.file_name,
                uploaded_by=uploaded_by,
                upload_date=document.upload_date,
                reason=request.form.get('reason', 'Initial upload')
            )
            db.session.add(initial_version)

        db.session.commit()
        
        return success_response(data=document.to_dict(), message='Document uploaded successfully')
    
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        # Accept either numeric id or DOCxxx format
        try:
            if isinstance(doc_id, str) and doc_id.upper().startswith('DOC'):
                doc_id_int = int(doc_id.replace('DOC', ''))
            else:
                doc_id_int = int(doc_id)
        except Exception:
            return error_response('Invalid document id', 400)

        document = Document.query.get(doc_id_int)
        if not document:
            return error_response('Document not found', 404)
        return success_response(data=document.to_dict())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    try:
        try:
            if isinstance(doc_id, str) and doc_id.upper().startswith('DOC'):
                doc_id_int = int(doc_id.replace('DOC', ''))
            else:
                doc_id_int = int(doc_id)
        except Exception:
            return error_response('Invalid document id', 400)

        document = Document.query.get(doc_id_int)
        if not document:
            return error_response('Document not found', 404)
        if not os.path.exists(document.file_path):
            return error_response('File not found', 404)
        return send_file(document.file_path, as_attachment=True, download_name=document.file_name)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/employee/<employee_id>', methods=['GET'])
def get_employee_documents(employee_id):
    try:
        documents = Document.query.filter_by(employee_id=employee_id).all()
        return success_response(data=[doc.to_dict() for doc in documents])
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/<doc_id>/update', methods=['POST'])
def update_document(doc_id):
    """Update an existing document by uploading a new version"""
    try:
        # Accept DOCxxx or numeric id
        try:
            if isinstance(doc_id, str) and doc_id.upper().startswith('DOC'):
                doc_id_int = int(doc_id.replace('DOC', ''))
            else:
                doc_id_int = int(doc_id)
        except Exception:
            return error_response('Invalid document id', 400)

        document = Document.query.get(doc_id_int)
        if not document:
            return error_response('Document not found', 404)
        
        if 'file' not in request.files:
            return error_response('No file provided', 400)
        
        file = request.files['file']
        if file.filename == '':
            return error_response('No file selected', 400)
        
        if not allowed_file(file.filename):
            return error_response('Invalid file type', 400)
        
        # Get update reason (optional)
        reason = request.form.get('reason', '')
        uploaded_by = request.form.get('uploadedBy', 'System')
        
        # Save old version to version history (avoid duplicates)
        existing_old = DocumentVersion.query.filter_by(document_id=document.id, version_number=document.version, file_name=document.file_name).first()
        if not existing_old:
            old_version = DocumentVersion(
                document_id=document.id,
                version_number=document.version,
                file_path=document.file_path,
                file_name=document.file_name,
                uploaded_by=document.uploaded_by,
                upload_date=document.upload_date,
                reason='Previous version'
            )
            db.session.add(old_version)
        
        # Save new file
        file_info = save_uploaded_file(file, document.employee_id)
        
        # Update document with new version
        document.version += 1
        document.file_name = file_info['filename']
        document.file_path = file_info['filepath']
        document.file_size = file_info['size']
        document.uploaded_by = uploaded_by
        document.upload_date = datetime.utcnow()
        
        # Update optional fields if provided
        if request.form.get('issueDate'):
            document.issue_date = datetime.fromisoformat(request.form.get('issueDate'))
        if request.form.get('expiryDate'):
            document.expiry_date = datetime.fromisoformat(request.form.get('expiryDate'))
        if request.form.get('remarks'):
            document.remarks = request.form.get('remarks')
        
        document.status = document.calculate_status()
        
        # Save new version record (avoid duplicates)
        existing_new = DocumentVersion.query.filter_by(document_id=document.id, version_number=document.version, file_name=document.file_name).first()
        if not existing_new:
            new_version = DocumentVersion(
                document_id=document.id,
                version_number=document.version,
                file_path=document.file_path,
                file_name=document.file_name,
                uploaded_by=uploaded_by,
                reason=reason
            )
            db.session.add(new_version)
        
        db.session.commit()

        return success_response(data=document.to_dict(), message='Document updated successfully')
    
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/<doc_id>/versions', methods=['GET'])
def get_document_versions(doc_id):
    """Get version history for a document"""
    try:
        # Accept DOCxxx or numeric id
        try:
            if isinstance(doc_id, str) and doc_id.upper().startswith('DOC'):
                doc_id_int = int(doc_id.replace('DOC', ''))
            else:
                doc_id_int = int(doc_id)
        except Exception:
            return error_response('Invalid document id', 400)

        document = Document.query.get(doc_id_int)
        if not document:
            return error_response('Document not found', 404)

        # Only include historical versions with version_number less than current
        versions = DocumentVersion.query.filter_by(document_id=doc_id_int).filter(DocumentVersion.version_number < document.version).order_by(DocumentVersion.version_number.desc()).all()

        # Include current version (summary object)
        current_version = {
            'id': 0,
            'documentId': document.id,
            'versionNumber': document.version,
            'fileName': document.file_name,
            'uploadedBy': document.uploaded_by,
            'uploadDate': document.upload_date.strftime('%Y-%m-%d %H:%M:%S') if document.upload_date else None,
            'reason': 'Current version'
        }

        version_list = [current_version] + [v.to_dict() for v in versions]
        
        # If only current version exists (no history), return empty list or just current version
        # Returning current version so user knows there's at least one version
        return success_response(data=version_list, message=f'Found {len(version_list)} version(s)')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(f'Error: {str(e)}', 500)

@document_bp.route('/versions/<int:version_id>/download', methods=['GET'])
def download_version(version_id):
    """Download a specific version of a document"""
    try:
        version = DocumentVersion.query.get(version_id)
        if not version:
            return error_response('Version not found', 404)
        
        if not os.path.exists(version.file_path):
            return error_response('File not found', 404)
        
        return send_file(version.file_path, as_attachment=True, download_name=version.file_name)
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

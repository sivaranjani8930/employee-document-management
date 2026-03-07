from flask import Blueprint, request
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Document, Employee
from database.db_setup import db
from utils.response_helper import success_response, error_response
from datetime import datetime

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['POST'])
def search_documents():
    try:
        data = request.get_json()
        print(f"🔍 Search request received: {data}")
        
        # Support both camelCase and snake_case filter keys for compatibility
        employee_name = data.get('employeeName') or data.get('employee_name')
        employee_id = data.get('employeeId') or data.get('employee_id')
        store = data.get('store') or data.get('storeLocation') or data.get('store_location')
        document_type = data.get('documentType') or data.get('document_type')
        expiry_date_from = data.get('expiryDateFrom') or data.get('expiry_date_from')
        expiry_date_to = data.get('expiryDateTo') or data.get('expiry_date_to')

        # Start with Document query; only join Employee if needed for filters
        if employee_name or store:
            query = Document.query.join(Employee)
        else:
            query = Document.query

        if employee_name:
            query = query.filter(Employee.name.ilike(f"%{employee_name}%"))
        if employee_id:
            query = query.filter(Document.employee_id == employee_id)
        if store:
            query = query.filter(Employee.store.ilike(f"%{store}%"))
        if document_type:
            query = query.filter(Document.document_type == document_type)
        if expiry_date_from:
            query = query.filter(Document.expiry_date >= datetime.fromisoformat(expiry_date_from))
        if expiry_date_to:
            query = query.filter(Document.expiry_date <= datetime.fromisoformat(expiry_date_to))
        
        documents = query.all()
        print(f"✅ Found {len(documents)} documents")
        return success_response(data=[doc.to_dict() for doc in documents], message=f'Found {len(documents)} document(s)')
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

@search_bp.route('/statistics', methods=['GET'])
def get_statistics():
    try:
        from sqlalchemy import func
        total = Document.query.count()
        valid = Document.query.filter_by(status='valid').count()
        expiring = Document.query.filter_by(status='expiring').count()
        expired = Document.query.filter_by(status='expired').count()
        
        return success_response(data={
            'total': total,
            'valid': valid,
            'expiring': expiring,
            'expired': expired
        })
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

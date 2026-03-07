from flask import Blueprint, request
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Employee
from database.db_setup import db
from utils.response_helper import success_response, error_response

employee_bp = Blueprint('employees', __name__)

@employee_bp.route('/', methods=['GET'])
def get_all_employees():
    try:
        employees = Employee.query.filter_by(is_active=True).all()
        return success_response(data=[e.to_dict() for e in employees], message=f'Found {len(employees)} employee(s)')
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

@employee_bp.route('/<employee_id>', methods=['GET'])
def get_employee(employee_id):
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response('Employee not found', 404)
        return success_response(data=employee.to_dict())
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

from flask import Blueprint, request
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Template, Employee
from database.db_setup import db
from utils.response_helper import success_response, error_response
from datetime import datetime
import re

template_bp = Blueprint('templates', __name__)

@template_bp.route('/', methods=['GET'])
def get_all_templates():
    try:
        templates = Template.query.filter_by(is_active=True).all()
        return success_response(data=[t.to_dict() for t in templates])
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

@template_bp.route('/', methods=['POST'])
def create_template():
    try:
        data = request.get_json()
        if not data.get('name') or not data.get('content'):
            return error_response('Name and content required', 400)
        
        variables = re.findall(r'\{\{(\w+)\}\}', data['content'])
        template = Template(
            name=data['name'],
            content=data['content'],
            variables=','.join(set(variables))
        )
        db.session.add(template)
        db.session.commit()
        return success_response(data=template.to_dict(), message='Template created')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error: {str(e)}', 500)

@template_bp.route('/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    try:
        template = Template.query.get(template_id)
        if not template:
            return error_response('Template not found', 404)
        
        data = request.get_json()
        if 'name' in data:
            template.name = data['name']
        if 'content' in data:
            template.content = data['content']
            variables = re.findall(r'\{\{(\w+)\}\}', data['content'])
            template.variables = ','.join(set(variables))
        
        db.session.commit()
        return success_response(data=template.to_dict(), message='Template updated')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error: {str(e)}', 500)

@template_bp.route('/<int:template_id>/generate', methods=['POST'])
def generate_letter(template_id):
    try:
        template = Template.query.get(template_id)
        if not template:
            return error_response('Template not found', 404)
        
        data = request.get_json()
        employee_id = data.get('employeeId')
        employee = Employee.query.get(employee_id)
        if not employee:
            return error_response('Employee not found', 404)
        
        content = template.content
        content = content.replace('{{EmployeeName}}', employee.name)
        content = content.replace('{{Store}}', employee.store)
        content = content.replace('{{Position}}', employee.role)
        content = content.replace('{{Date}}', datetime.now().strftime('%B %d, %Y'))
        
        return success_response(data={'content': content, 'employeeName': employee.name})
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

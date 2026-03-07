from flask import Blueprint, request
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Category
from database.db_setup import db
from utils.response_helper import success_response, error_response

category_bp = Blueprint('categories', __name__)

@category_bp.route('/', methods=['GET'])
def get_all_categories():
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return success_response(data=[c.to_dict() for c in categories])
    except Exception as e:
        return error_response(f'Error: {str(e)}', 500)

@category_bp.route('/', methods=['POST'])
def create_category():
    try:
        data = request.get_json()
        if not data.get('name'):
            return error_response('Category name required', 400)
        
        existing = Category.query.filter_by(name=data['name']).first()
        if existing:
            return error_response('Category exists', 409)
        
        category = Category(name=data['name'], description=data.get('description', ''))
        db.session.add(category)
        db.session.commit()
        return success_response(data=category.to_dict(), message='Category created')
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error: {str(e)}', 500)

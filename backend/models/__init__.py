# models/__init__.py
# Simplified version that imports from the database setup

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models - they will be available when database is initialized
from models.employee import Employee
from models.document import Document
from models.category import Category
from models.template import Template
from models.version import DocumentVersion

__all__ = ['Employee', 'Document', 'Category', 'Template', 'DocumentVersion']

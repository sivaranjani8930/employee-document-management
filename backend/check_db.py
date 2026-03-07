#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import Document, Employee

app = create_app()
with app.app_context():
    total_docs = Document.query.count()
    print(f"\n📊 Total documents in DB: {total_docs}\n")
    
    docs = Document.query.all()
    for doc in docs:
        emp = Employee.query.get(doc.employee_id)
        print(f"  DOC{str(doc.id).zfill(3)} | {emp.name if emp else 'N/A'} | {doc.document_type} | {doc.file_name}")
    
    print(f"\n✅ Query complete.\n")

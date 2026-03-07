import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import Document, DocumentVersion, Employee

app = create_app()
with app.app_context():
    emp_id = 'EMP002'
    emp = Employee.query.get(emp_id)
    print(f"Employee: {emp_id} - {emp.name if emp else 'N/A'}")

    docs = Document.query.filter_by(employee_id=emp_id).all()
    print(f"\nFound {len(docs)} document(s) for {emp_id}:")
    for d in docs:
        print(f"  Document row: id={d.id}, file_name={d.file_name}, version={d.version}, uploaded_by={d.uploaded_by}, upload_date={d.upload_date}")
        versions = DocumentVersion.query.filter_by(document_id=d.id).order_by(DocumentVersion.version_number.desc()).all()
        print(f"    -> {len(versions)} version record(s)")
        for v in versions:
            print(f"       - version_id={v.id}, version_number={v.version_number}, file_name={v.file_name}, uploaded_by={v.uploaded_by}, upload_date={v.upload_date}, reason={v.reason}")

    print('\nDone.')

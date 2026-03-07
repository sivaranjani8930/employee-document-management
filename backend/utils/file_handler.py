import os
from werkzeug.utils import secure_filename
from flask import current_app
from datetime import datetime

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, employee_id):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = secure_filename(file.filename)
    base_name = filename.rsplit('.', 1)[0]
    ext = filename.rsplit('.', 1)[1]
    unique_filename = f"{employee_id}_{base_name}_{timestamp}.{ext}"
    
    upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], employee_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    filepath = os.path.join(upload_dir, unique_filename)
    file.save(filepath)
    
    return {
        'filename': unique_filename,
        'filepath': filepath,
        'size': os.path.getsize(filepath)
    }


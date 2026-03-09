import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Config:
    SECRET_KEY = 'dev-secret-key-change-in-production'
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{os.path.join(BASE_DIR, "instance", "edms.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'documents')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'jpg', 'jpeg', 'png'}
    # SMTP / Notification settings (loaded from .env or environment variables)
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASS = os.environ.get('SMTP_PASS', '')
    HR_NOTIFICATION_EMAIL = os.environ.get('HR_NOTIFICATION_EMAIL', 'sivaranjani8930@gmail.com')
    # Notification thresholds in days
    NOTIFICATION_THRESHOLDS = [60, 30, 15, 7]
    
    @staticmethod
    def init_app(app):
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(Config.BASE_DIR, 'instance'), exist_ok=True)

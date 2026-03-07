import sys
import os

# FIX: Add current directory to Python path BEFORE any other imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from config import Config
from database.db_setup import db, init_db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Config.init_app(app)
    
    CORS(app)
    db.init_app(app)
    
    # Import blueprints
    from routes.document_routes import document_bp
    from routes.search_routes import search_bp
    from routes.template_routes import template_bp
    from routes.category_routes import category_bp
    from routes.employee_routes import employee_bp
    from routes.notification_routes import notification_bp
    
    # Register blueprints
    app.register_blueprint(document_bp, url_prefix='/api/documents')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(template_bp, url_prefix='/api/templates')
    app.register_blueprint(category_bp, url_prefix='/api/categories')
    app.register_blueprint(employee_bp, url_prefix='/api/employees')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    
    # Initialize database
    with app.app_context():
        init_db()
        # Run an initial expiry check (non-blocking)
        try:
            from utils.notifications import check_and_send_expiry_notifications
            # run once at startup
            check_and_send_expiry_notifications()
        except Exception as e:
            print(f"Warning: expiry notification check failed at startup: {e}")
    
    @app.route('/')
    def index():
        return {'message': 'Employee Document Management System API', 'status': 'running'}
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'message': 'API is running'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*60)
    print("🚀 SERVER STARTING...")
    print("="*60)
    print("📍 API URL: http://localhost:5000")
    print("📍 Health Check: http://localhost:5000/health")
    print("📍 API Endpoints:")
    print("   - GET  /api/employees/")
    print("   - GET  /api/categories/")
    print("   - GET  /api/templates/")
    print("   - POST /api/documents/upload")
    print("   - POST /api/search/")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)

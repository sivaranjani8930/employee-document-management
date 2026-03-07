from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db():
    db.create_all()
    # Create missing tables then ensure version table columns exist (safety for upgrades)
    seed_initial_data()
    try:
        ensure_versions_table_columns()
    except Exception as e:
        # Don't fail app start for this housekeeping step; log for debugging
        print(f"Warning: ensure_versions_table_columns failed: {e}")

def seed_initial_data():
    from models.employee import Employee
    from models.category import Category
    from models.template import Template
    
    if Employee.query.first() is not None:
        return
    
    employees = [
        Employee(id='EMP001', name='Rajesh Kumar', store='Station Alpha', role='Manager', email='rajesh@example.com', phone='9876543210'),
        Employee(id='EMP002', name='Priya Singh', store='Station Beta', role='Cashier', email='priya@example.com', phone='9876543211'),
        Employee(id='EMP003', name='Amit Patel', store='Store Gamma', role='Supervisor', email='amit@example.com', phone='9876543212'),
        Employee(id='EMP004', name='Sneha Reddy', store='Station Delta', role='Attendant', email='sneha@example.com', phone='9876543213'),
        Employee(id='EMP005', name='Vikram Sharma', store='Store Epsilon', role='Sales Associate', email='vikram@example.com', phone='9876543214'),
        Employee(id='EMP006', name='Nisha Verma', store='Station Zeta', role='Cashier', email='nisha@example.com', phone='9876543220'),
        Employee(id='EMP007', name='Karan Mehta', store='Station Eta', role='Supervisor', email='karan@example.com', phone='9876543221'),
        Employee(id='EMP008', name='Sonal Gupta', store='Station Theta', role='Manager', email='sonal@example.com', phone='9876543222'),
        Employee(id='EMP009', name='Rahul Joshi', store='Store Iota', role='Attendant', email='rahul@example.com', phone='9876543223'),
        Employee(id='EMP010', name='Pooja Desai', store='Store Kappa', role='Sales Associate', email='pooja@example.com', phone='9876543224')
    ]
    
    for emp in employees:
        db.session.add(emp)
    
    categories = [
        Category(name='ID Proof', description='Government issued ID documents'),
        Category(name='Driving License', description='Valid driving license'),
        Category(name='Medical Certificate', description='Health and fitness certificates'),
        Category(name='Training Certificate', description='Training and skill certificates'),
        Category(name='Employment Contract', description='Employment agreements'),
        Category(name='Educational Certificate', description='Educational qualifications'),
        Category(name='Address Proof', description='Proof of residence'),
        Category(name='Police Verification', description='Background verification documents')
    ]
    
    for cat in categories:
        db.session.add(cat)
    
    templates = [
        Template(name='Warning Letter', content='''Date: {{Date}}

To,
{{EmployeeName}}
{{Store}}

Subject: Warning Letter

Dear {{EmployeeName}},

This letter serves as a formal warning regarding [reason].

Regards,
HR Department''', variables='Date,EmployeeName,Store'),
        Template(name='Offer Letter', content='''Date: {{Date}}

Dear {{EmployeeName}},

We are pleased to offer you the position of {{Position}} at {{Store}}.

Sincerely,
HR Department''', variables='Date,EmployeeName,Position,Store')
    ]
    
    for template in templates:
        db.session.add(template)
    
    db.session.commit()
    print("✅ Database seeded with initial data!")

def ensure_versions_table_columns():
    """Ensure `document_versions` table has expected columns. Adds missing columns using ALTER TABLE (SQLite supports ADD COLUMN).
    This helps existing deployments where the table was created before the model was extended.
    """
    from sqlalchemy import text
    engine = db.get_engine()
    conn = engine.connect()
    try:
        # Get existing columns
        res = conn.execute(text("PRAGMA table_info(document_versions);"))
        rows = res.fetchall()
        existing = {row[1] for row in rows} if rows is not None else set()

        # Define expected columns and their SQL types
        expected = {
            'file_path': 'TEXT',
            'file_name': 'TEXT',
            'uploaded_by': 'TEXT',
            'upload_date': 'DATETIME',
            'reason': 'TEXT',
            'version_number': 'INTEGER'
        }

        for col, coltype in expected.items():
            if col not in existing:
                try:
                    alter_sql = f"ALTER TABLE document_versions ADD COLUMN {col} {coltype};"
                    conn.execute(text(alter_sql))
                    print(f"✅ Added missing column '{col}' to document_versions")
                except Exception as e:
                    print(f"⚠️ Could not add column {col}: {e}")
    finally:
        conn.close()

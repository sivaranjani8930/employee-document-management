from database.db_setup import db
from datetime import datetime

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    variables = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': f'T{str(self.id).zfill(3)}',
            'name': self.name,
            'content': self.content,
            'variables': self.variables.split(',') if self.variables else []
        }

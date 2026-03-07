from flask import Blueprint, jsonify
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.notifications import get_expiring_documents, check_and_send_expiry_notifications

notification_bp = Blueprint('notifications', __name__)


@notification_bp.route('/expiries', methods=['GET'])
def expiries():
    try:
        # Return documents expiring within default threshold (max)
        docs = get_expiring_documents()
        return jsonify({'success': True, 'data': docs, 'message': f'Found {len(docs)} expiring document(s)'}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@notification_bp.route('/expiries/check-and-send', methods=['POST'])
def expiries_check_send():
    try:
        sent = check_and_send_expiry_notifications()
        return jsonify({'success': True, 'message': 'Notifications sent' if sent else 'No notifications to send', 'sent': sent}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

import smtplib
import json
import os
from email.message import EmailMessage
from datetime import datetime, timedelta
from database.db_setup import db
from models import Document
from config import Config

LOG_PATH = os.path.join(Config.BASE_DIR, 'instance', 'notification_log.json')

def _load_log():
    if not os.path.exists(LOG_PATH):
        return {}
    try:
        with open(LOG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def _save_log(log):
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(log, f, default=str)

_smtp_error_logged = False

def send_email(to_address, subject, body):
    global _smtp_error_logged
    # If SMTP_USER/PASS not set, skip sending but log once
    if not Config.SMTP_USER or not Config.SMTP_PASS:
        if not _smtp_error_logged:
            print(f"[notifications] ⚠️  SMTP not configured. Email notifications disabled.")
            print(f"[notifications] To enable: set SMTP_USER and SMTP_PASS in .env or environment variables.")
            _smtp_error_logged = True
        return False
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = Config.SMTP_USER
        msg['To'] = to_address
        msg.set_content(body)

        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(Config.SMTP_USER, Config.SMTP_PASS)
            server.send_message(msg)
        print(f"[notifications] ✓ Email sent to {to_address}: {subject}")
        return True
    except Exception as e:
        if not _smtp_error_logged:
            print(f"[notifications] ⚠️  SMTP Error: {type(e).__name__}: {str(e)[:100]}")
            print(f"[notifications] For Gmail: use an App Password (https://myaccount.google.com/apppasswords)")
            print(f"[notifications] Or enable 'Less Secure Apps': https://myaccount.google.com/lesssecureapps")
            _smtp_error_logged = True
        return False

def get_expiring_documents(days_ahead=60):
    """Return documents expiring within the next `days_ahead` days."""
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=days_ahead)
    docs = Document.query.filter(Document.expiry_date != None).all()
    results = []
    for d in docs:
        if not d.expiry_date:
            continue
        days_left = (d.expiry_date.date() - today).days
        if 0 <= days_left <= days_ahead:
            results.append({
                'id': d.id,
                'docId': f"DOC{str(d.id).zfill(3)}",
                'employeeId': d.employee_id,
                'employeeName': d.employee.name if d.employee else None,
                'documentType': d.document_type,
                'fileName': d.file_name,
                'expiryDate': d.expiry_date.strftime('%Y-%m-%d'),
                'daysLeft': days_left,
            })
    # sort by daysLeft
    results.sort(key=lambda x: x['daysLeft'])
    return results

def check_and_send_expiry_notifications():
    """Check documents against notification thresholds and send emails to HR.
    Uses a log file to avoid repeated notifications for the same document+threshold.
    """
    thresholds = Config.NOTIFICATION_THRESHOLDS
    log = _load_log()
    sent_any = False

    docs = get_expiring_documents(days_ahead=max(thresholds))
    if not docs:
        print("[notifications] No expiring documents found (within 60 days).")
        return False
    
    print(f"[notifications] Found {len(docs)} expiring document(s). Processing notifications...")
    
    for d in docs:
        for th in thresholds:
            if d['daysLeft'] <= th:
                key = f"{d['id']}_{th}"
                if log.get(key):
                    # already sent for this threshold
                    continue
                # send email
                subject = f"Document Expiry Notice: {d['docId']} ({d['fileName']})"
                body = (
                    f"Document {d['docId']} for {d['employeeName']} ({d['employeeId']}) "
                    f"is expiring in {d['daysLeft']} day(s) on {d['expiryDate']}.\n\n"
                    "Please update the document as needed.\n\n"
                    "This is an automated notification."
                )
                ok = send_email(Config.HR_NOTIFICATION_EMAIL, subject, body)
                if ok:
                    log[key] = {'sent_at': datetime.utcnow().isoformat(), 'doc': d}
                    sent_any = True
                # Log even if SMTP failed, to avoid repeated attempts
                else:
                    log[key] = {'sent_at': datetime.utcnow().isoformat(), 'doc': d, 'smtp_error': True}
                    sent_any = True

    if sent_any:
        _save_log(log)
    return sent_any

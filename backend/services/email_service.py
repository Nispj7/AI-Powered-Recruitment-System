import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# 📧 CONFIGURATION
# User needs to provide an App Password for this to work
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "nisargpj7@gmail.com"
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD", "xukz gdvf ywmw ygwy") 

def send_schedule_email(receiver_email, candidate_name, password, interview_time):
    """
    Sends a professional interview invitation email.
    """
    if SENDER_PASSWORD == "PLACEHOLDER_APP_PASSWORD":
        print(f"Skipping email to {receiver_email} (No App Password configured)")
        return False

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = receiver_email
    msg['Subject'] = "🚀 Interview Scheduled: AI Recruitment Portal"

    body = f"""
    Hello {candidate_name},

    We are pleased to invite you for an AI-powered technical interview.

    📅 **Interview Schedule:** {interview_time}
    🔗 **Link:** http://localhost:5173/

    🔐 **Login Credentials:**
    - Email: {receiver_email}
    - Password: {password}

    Please ensure you are in a quiet environment with a working microphone.

    Best regards,
    AI Recruitment Team
    """

    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {receiver_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

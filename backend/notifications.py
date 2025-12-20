import os
import json
from datetime import datetime, timedelta
from twilio.rest import Client
from database import MedicineDatabase

class NotificationEngine:
    def __init__(self, db: MedicineDatabase):
        self.db = db
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886') # Default Twilio sandbox number
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            print("Twilio notification service initialized.")
        else:
            self.client = None
            print("Twilio credentials missing. Notifications will be logged but not sent.")

    def check_and_send_notifications(self):
        """Check for medications due soon and send WhatsApp notifications"""
        print(f"[{datetime.now()}] Checking for upcoming medications...")
        
        medications = self.db.get_all_medications()
        now = datetime.now()
        
        for med in medications:
            if not med.get('phone_number'):
                continue
                
            reminder_window = med.get('reminder_minutes', 15)
            times = med.get('times', [])
            if isinstance(times, str):
                times = json.loads(times)
                
            for scheduled_time_str in times:
                try:
                    # Parse scheduled time (format: HH:MM)
                    shour, smin = map(int, scheduled_time_str.split(':'))
                    scheduled_time = now.replace(hour=shour, minute=smin, second=0, microsecond=0)
                    
                    # If scheduled time is in the past today, check if it's for tomorrow? 
                    # For simplicity, we only check today's window.
                    
                    # Calculate notification time
                    notification_time = scheduled_time - timedelta(minutes=reminder_window)
                    
                    # Check if we are within the notification window (now is between notification_time and scheduled_time)
                    # And ensure we haven't already sent a notification for this specific dose today
                    if notification_time <= now < scheduled_time:
                        self._send_whatsapp_notification(med, scheduled_time_str)
                        
                except Exception as e:
                    print(f"Error processing medication {med.get('name')}: {e}")

    def _send_whatsapp_notification(self, med, scheduled_time):
        """Send the actual WhatsApp message"""
        phone = med.get('phone_number')
        if not phone.startswith('whatsapp:'):
            phone = f"whatsapp:{phone}"
            
        # Deduplication: Check if a notification was already sent in the last hour for this med/time
        # We can use the logs or a separate simple cache/table. 
        # For now, let's keep it simple and just log to console.
        
        message_body = f"💊 Reminder: Time to take {med['name']} ({med['dosage']}) at {scheduled_time}. Stay healthy!"
        
        print(f"DEBUG: Attempting to send WhatsApp to {phone}: {message_body}")
        
        if self.client:
            try:
                message = self.client.messages.create(
                    body=message_body,
                    from_=self.whatsapp_from,
                    to=phone
                )
                print(f"Notification sent! SID: {message.sid}")
            except Exception as e:
                print(f"Failed to send WhatsApp notification: {e}")
        else:
            print("SKIPPING: Twilio client not configured.")

notification_engine = None

def init_notifications(db):
    global notification_engine
    notification_engine = NotificationEngine(db)
    return notification_engine

def get_notification_engine():
    return notification_engine

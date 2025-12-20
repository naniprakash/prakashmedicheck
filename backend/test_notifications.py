from notifications import NotificationEngine
from unittest.mock import MagicMock
from datetime import datetime, timedelta
import json

def test_notification_logic():
    # Setup mock DB
    db = MagicMock()
    
    # Mock medication due in 10 minutes, with 15 min reminder window
    now = datetime.now()
    due_time = (now + timedelta(minutes=10)).strftime('%H:%M')
    
    meds = [{
        'id': 1,
        'name': 'Test Med',
        'dosage': '10mg',
        'times': json.dumps([due_time]),
        'phone_number': 'whatsapp:+1234567890',
        'reminder_minutes': 15
    }]
    db.get_all_medications.return_value = meds
    
    # Setup Notification Engine
    engine = NotificationEngine(db)
    engine.client = MagicMock() # Mock Twilio client
    
    print(f"Current time: {now.strftime('%H:%M')}")
    print(f"Medication due at: {due_time}")
    print(f"Reminder window: 15 minutes")
    
    # Run check
    engine.check_and_send_notifications()
    
    # Verify that send_whatsapp_notification was called
    # Since _send_whatsapp_notification is an internal method, we check if the mock client's messages.create was called
    if engine.client.messages.create.called:
        print("✅ SUCCESS: Notification was triggered correctly!")
        args, kwargs = engine.client.messages.create.call_args
        print(f"Message sent to: {kwargs['to']}")
        print(f"Body: {kwargs['body']}")
    else:
        print("❌ FAILURE: Notification was NOT triggered.")

if __name__ == "__main__":
    test_notification_logic()

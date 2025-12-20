import os
# Use a temporary database for testing
os.environ['DATABASE_URL'] = 'sqlite:///test_medicine_tracker.db'

from database import MedicineDatabase
import json

def test_google_auth_logic():
    db = MedicineDatabase()
    
    print("Testing User Creation and Data Scoping Logic...")
    
    # Simulate first user
    user1 = db.get_or_create_user(
        google_id='google_user_1',
        email='user1@example.com',
        name='User One'
    )
    
    # Simulate second user
    user2 = db.get_or_create_user(
        google_id='google_user_2',
        email='user2@example.com',
        name='User Two'
    )
    
    print(f"Created users: {user1.email} (ID: {user1.id}), {user2.email} (ID: {user2.id})")
    
    # Add medication for User 1
    med1_id = db.add_medication(
        user_id=user1.id,
        name='Med for User 1',
        dosage='10mg',
        frequency='daily',
        times=['09:00'],
        start_date='2025-01-01'
    )
    
    # Add medication for User 2
    med2_id = db.add_medication(
        user_id=user2.id,
        name='Med for User 2',
        dosage='20mg',
        frequency='daily',
        times=['10:00'],
        start_date='2025-01-01'
    )
    
    # Verify User 1 only sees their meds
    meds1 = db.get_all_medications(user1.id)
    if len(meds1) == 1 and meds1[0]['name'] == 'Med for User 1':
        print("✅ SUCCESS: User 1 data scoped correctly.")
    else:
        print(f"❌ FAILURE: User 1 scoping failed. Found: {[m['name'] for m in meds1]}")

    # Verify User 2 only sees their meds
    meds2 = db.get_all_medications(user2.id)
    if len(meds2) == 1 and meds2[0]['name'] == 'Med for User 2':
        print("✅ SUCCESS: User 2 data scoped correctly.")
    else:
        print(f"❌ FAILURE: User 2 scoping failed. Found: {[m['name'] for m in meds2]}")

if __name__ == "__main__":
    test_google_auth_logic()

if __name__ == "__main__":
    test_google_auth_logic()

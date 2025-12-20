from flask import Flask, request, jsonify
from flask_cors import CORS
from database import MedicineDatabase
from models.pill_recognition import PillRecognitionModel
from models.adherence_predictor import AdherencePredictor
from models.interaction_checker import InteractionChecker
from datetime import datetime, timedelta
import os
import base64
from flask_apscheduler import APScheduler
from notifications import init_notifications
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
# Allow CORS for development and the primary production origin
# For production, we allow any .onrender.com subdomain to handle dynamic URL assignments
CORS(app, origins=["https://medicine-tracker-ui.onrender.com", "http://localhost:5173"], supports_credentials=True)

# Initialize components
print("Initializing Database...")
try:
    db = MedicineDatabase()
    print("Database initialized successfully.")
except Exception as e:
    print(f"FAILED to initialize database: {e}")
    raise

print("Initializing ML Models...")
try:
    pill_model = PillRecognitionModel()
    adherence_model = AdherencePredictor()
    interaction_checker = InteractionChecker()
    print("ML Models initialized successfully.")
except Exception as e:
    print(f"FAILED to initialize ML models: {e}")
    raise

# Initialize Notifications & Scheduler
print("Initializing Notifications...")
notification_engine = init_notifications(db)
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

@scheduler.task('interval', id='check_notifications', minutes=1)
def check_notifications():
    with app.app_context():
        notification_engine.check_and_send_notifications()

print("Notification Scheduler started (every 1 minute).")

# GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
# In production, get this from environment variable
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

def get_authenticated_user():
    """Extract and verify Google ID token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        # Get or create user in database
        user = db.get_or_create_user(
            google_id=idinfo['sub'],
            email=idinfo['email'],
            name=idinfo.get('name')
        )
        return user
    except ValueError:
        # Invalid token
        return None

# ============= Auth Endpoints =============

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Handle Google Sign-In"""
    user = get_authenticated_user()
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        })
    else:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

# ============= Medication Endpoints =============

@app.route('/api/medications', methods=['GET'])
def get_medications():
    """Get all medications for the authenticated user"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        medications = db.get_all_medications(user.id)
        return jsonify({'success': True, 'medications': medications})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications', methods=['POST'])
def add_medication():
    """Add a new medication for the authenticated user"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        data = request.json
        
        med_id = db.add_medication(
            user_id=user.id,
            name=data['name'],
            dosage=data['dosage'],
            frequency=data['frequency'],
            times=data['times'],
            start_date=data['start_date'],
            end_date=data.get('end_date'),
            notes=data.get('notes'),
            image_path=data.get('image_path'),
            phone_number=data.get('phone_number'),
            reminder_minutes=data.get('reminder_minutes', 15)
        )
        
        # Check for interactions with existing medications
        all_meds = db.get_all_medications()
        med_names = [m['name'] for m in all_meds]
        interactions = interaction_checker.check_interactions(med_names)
        
        return jsonify({
            'success': True,
            'medication_id': med_id,
            'interactions': interactions
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['GET'])
def get_medication(med_id):
    """Get a specific medication"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        medication = db.get_medication(med_id, user.id)
        if medication:
            return jsonify({'success': True, 'medication': medication})
        else:
            return jsonify({'success': False, 'error': 'Medication not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['PUT'])
def update_medication(med_id):
    """Update a medication"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        data = request.json
        success = db.update_medication(med_id, user.id, **data)
        
        if success:
            return jsonify({'success': True, 'message': 'Medication updated'})
        else:
            return jsonify({'success': False, 'error': 'Medication not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['DELETE'])
def delete_medication(med_id):
    """Delete a medication"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        success = db.delete_medication(med_id, user.id)
        
        if success:
            return jsonify({'success': True, 'message': 'Medication deleted'})
        else:
            return jsonify({'success': False, 'error': 'Medication not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============= Medication Logs Endpoints =============

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get medication logs"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        med_id = request.args.get('medication_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        logs = db.get_medication_logs(user.id, med_id, start_date, end_date)
        return jsonify({'success': True, 'logs': logs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logs', methods=['POST'])
def log_medication():
    """Log medication intake"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        data = request.json
        
        log_id = db.log_medication(
            user_id=user.id,
            medication_id=data['medication_id'],
            scheduled_time=data['scheduled_time'],
            taken_time=data.get('taken_time'),
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        
        return jsonify({'success': True, 'log_id': log_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logs/<int:log_id>', methods=['PUT'])
def update_log(log_id):
    """Update medication log status"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        data = request.json
        success = db.update_log_status(
            log_id,
            user.id,
            data['status'],
            data.get('taken_time')
        )
        
        if success:
            return jsonify({'success': True, 'message': 'Log updated'})
        else:
            return jsonify({'success': False, 'error': 'Log not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============= ML Endpoints =============

@app.route('/api/ml/recognize-pill', methods=['POST'])
def recognize_pill():
    """Recognize pill from image using ML"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Perform recognition
        result = pill_model.predict_with_features(image_data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/predict-adherence', methods=['POST'])
def predict_adherence():
    """Predict medication adherence"""
    try:
        data = request.json
        medication_id = data.get('medication_id')
        
        # Get medication logs
        logs = db.get_medication_logs(medication_id)
        
        # Predict adherence
        prediction = adherence_model.predict_adherence(logs)
        
        # Save prediction
        db.save_ml_prediction(
            medication_id,
            'adherence',
            prediction['adherence_probability'],
            prediction['confidence']
        )
        
        return jsonify({
            'success': True,
            **prediction
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/check-interactions', methods=['POST'])
def check_interactions():
    """Check drug interactions"""
    try:
        data = request.json
        medications = data.get('medications', [])
        
        if not medications:
            # Get all current medications
            all_meds = db.get_all_medications()
            medications = [m['name'] for m in all_meds]
        
        result = interaction_checker.check_interactions(medications)
        
        return jsonify({
            'success': True,
            **result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============= Analytics Endpoints =============

@app.route('/api/analytics/adherence', methods=['GET'])
def get_adherence_stats():
    """Get adherence statistics"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        med_id = request.args.get('medication_id', type=int)
        days = request.args.get('days', default=30, type=int)
        
        stats = db.get_adherence_stats(user.id, med_id, days)
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard overview data"""
    user = get_authenticated_user()
    if not user:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
    try:
        # Get all medications
        medications = db.get_all_medications(user.id)
        
        # Get today's schedule
        today = datetime.now().strftime('%Y-%m-%d')
        today_logs = db.get_medication_logs(
            user.id,
            start_date=today,
            end_date=today
        )
        
        # Get adherence stats
        stats = db.get_adherence_stats(user.id, days=7)
        
        # Check interactions
        med_names = [m['name'] for m in medications]
        interactions = interaction_checker.check_interactions(med_names)
        
        return jsonify({
            'success': True,
            'total_medications': len(medications),
            'today_doses': len(today_logs),
            'adherence_rate': stats.get('adherence_rate', 0),
            'interactions': interactions,
            'medications': medications[:5]  # Top 5 for quick view
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============= Model Info Endpoints =============

@app.route('/api/models/info', methods=['GET'])
def get_models_info():
    """Get information about ML models"""
    return jsonify({
        'success': True,
        'pill_recognition': pill_model.get_model_info(),
        'adherence_predictor': adherence_model.get_model_info(),
        'interaction_checker': interaction_checker.get_database_stats()
    })

# ============= Health Check =============

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🏥 Medicine Tracker API Server")
    print("=" * 50)
    print(f"Server starting on port {port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False)


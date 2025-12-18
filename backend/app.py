from flask import Flask, request, jsonify
from flask_cors import CORS
from database import MedicineDatabase
from models.pill_recognition import PillRecognitionModel
from models.adherence_predictor import AdherencePredictor
from models.interaction_checker import InteractionChecker
from datetime import datetime, timedelta
import os
import base64

app = Flask(__name__)
CORS(app)

# Initialize components
db = MedicineDatabase()
pill_model = PillRecognitionModel()
adherence_model = AdherencePredictor()
interaction_checker = InteractionChecker()

# Ensure upload directory exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============= Medication Endpoints =============

@app.route('/api/medications', methods=['GET'])
def get_medications():
    """Get all medications"""
    try:
        medications = db.get_all_medications()
        return jsonify({'success': True, 'medications': medications})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications', methods=['POST'])
def add_medication():
    """Add a new medication"""
    try:
        data = request.json
        
        med_id = db.add_medication(
            name=data['name'],
            dosage=data['dosage'],
            frequency=data['frequency'],
            times=data['times'],
            start_date=data['start_date'],
            end_date=data.get('end_date'),
            notes=data.get('notes'),
            image_path=data.get('image_path')
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
    try:
        medication = db.get_medication(med_id)
        if medication:
            return jsonify({'success': True, 'medication': medication})
        else:
            return jsonify({'success': False, 'error': 'Medication not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['PUT'])
def update_medication(med_id):
    """Update a medication"""
    try:
        data = request.json
        success = db.update_medication(med_id, **data)
        
        if success:
            return jsonify({'success': True, 'message': 'Medication updated'})
        else:
            return jsonify({'success': False, 'error': 'Medication not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['DELETE'])
def delete_medication(med_id):
    """Delete a medication"""
    try:
        success = db.delete_medication(med_id)
        
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
    try:
        med_id = request.args.get('medication_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        logs = db.get_medication_logs(med_id, start_date, end_date)
        return jsonify({'success': True, 'logs': logs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logs', methods=['POST'])
def log_medication():
    """Log medication intake"""
    try:
        data = request.json
        
        log_id = db.log_medication(
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
    try:
        data = request.json
        success = db.update_log_status(
            log_id,
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
    try:
        med_id = request.args.get('medication_id', type=int)
        days = request.args.get('days', default=30, type=int)
        
        stats = db.get_adherence_stats(med_id, days)
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard overview data"""
    try:
        # Get all medications
        medications = db.get_all_medications()
        
        # Get today's schedule
        today = datetime.now().strftime('%Y-%m-%d')
        today_logs = db.get_medication_logs(
            start_date=today,
            end_date=today
        )
        
        # Get adherence stats
        stats = db.get_adherence_stats(days=7)
        
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
    print("🏥 Medicine Tracker API Server")
    print("=" * 50)
    print("Server starting on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)

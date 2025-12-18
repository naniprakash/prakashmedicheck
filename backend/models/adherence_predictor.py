import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pickle

class AdherencePredictor:
    """
    ML model to predict medication adherence patterns
    Uses historical data to predict likelihood of missing doses
    """
    
    def __init__(self, model_path=None):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
        if model_path:
            self.load_model(model_path)
    
    def extract_features(self, medication_logs: List[Dict], 
                        current_time: Optional[datetime] = None) -> np.ndarray:
        """
        Extract features from medication logs for prediction
        Features include:
        - Time of day
        - Day of week
        - Recent adherence rate
        - Time since last dose
        - Streak of consecutive doses
        """
        if current_time is None:
            current_time = datetime.now()
        
        features = []
        
        # Sort logs by time
        sorted_logs = sorted(medication_logs, 
                           key=lambda x: x.get('scheduled_time', ''),
                           reverse=True)
        
        # Time-based features
        hour = current_time.hour
        day_of_week = current_time.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Calculate recent adherence (last 7 days)
        recent_logs = [log for log in sorted_logs 
                      if self._is_within_days(log.get('scheduled_time', ''), 7)]
        
        if recent_logs:
            taken_count = sum(1 for log in recent_logs if log.get('status') == 'taken')
            recent_adherence = taken_count / len(recent_logs)
        else:
            recent_adherence = 0.5  # Default
        
        # Calculate streak
        current_streak = self._calculate_streak(sorted_logs)
        
        # Time since last dose (in hours)
        if sorted_logs and sorted_logs[0].get('taken_time'):
            last_dose_time = datetime.fromisoformat(sorted_logs[0]['taken_time'])
            hours_since_last = (current_time - last_dose_time).total_seconds() / 3600
        else:
            hours_since_last = 24  # Default
        
        # Missed doses in last week
        missed_count = sum(1 for log in recent_logs if log.get('status') == 'missed')
        
        # Average delay (when taken late)
        delays = []
        for log in recent_logs:
            if log.get('status') == 'taken' and log.get('taken_time') and log.get('scheduled_time'):
                scheduled = datetime.fromisoformat(log['scheduled_time'])
                taken = datetime.fromisoformat(log['taken_time'])
                delay = (taken - scheduled).total_seconds() / 3600
                if delay > 0:
                    delays.append(delay)
        
        avg_delay = np.mean(delays) if delays else 0
        
        features = [
            hour,
            day_of_week,
            is_weekend,
            recent_adherence,
            current_streak,
            hours_since_last,
            missed_count,
            avg_delay,
            len(recent_logs)  # Total doses in recent period
        ]
        
        return np.array(features).reshape(1, -1)
    
    def _is_within_days(self, timestamp_str: str, days: int) -> bool:
        """Check if timestamp is within specified days"""
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
            cutoff = datetime.now() - timedelta(days=days)
            return timestamp >= cutoff
        except:
            return False
    
    def _calculate_streak(self, sorted_logs: List[Dict]) -> int:
        """Calculate current streak of consecutive taken doses"""
        streak = 0
        for log in sorted_logs:
            if log.get('status') == 'taken':
                streak += 1
            else:
                break
        return streak
    
    def train(self, training_data: List[Dict]):
        """
        Train the model on historical data
        training_data: list of dicts with 'features' and 'label' (0=missed, 1=taken)
        """
        if not training_data:
            # Use synthetic data for demo
            training_data = self._generate_synthetic_data()
        
        X = np.array([d['features'] for d in training_data])
        y = np.array([d['label'] for d in training_data])
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
    
    def predict_adherence(self, medication_logs: List[Dict], 
                         current_time: Optional[datetime] = None) -> Dict:
        """
        Predict likelihood of taking medication on time
        Returns probability and risk level
        """
        if not self.is_trained:
            # Train with synthetic data if not trained
            self.train([])
        
        # Extract features
        features = self.extract_features(medication_logs, current_time)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict
        probability = self.model.predict_proba(features_scaled)[0]
        
        # Probability of taking medication
        adherence_prob = probability[1] if len(probability) > 1 else 0.5
        
        # Determine risk level
        if adherence_prob >= 0.8:
            risk_level = 'low'
            message = 'High likelihood of adherence'
        elif adherence_prob >= 0.5:
            risk_level = 'medium'
            message = 'Moderate adherence risk - consider reminder'
        else:
            risk_level = 'high'
            message = 'High risk of missing dose - send reminder'
        
        # Get feature importance
        feature_names = [
            'hour', 'day_of_week', 'is_weekend', 'recent_adherence',
            'current_streak', 'hours_since_last', 'missed_count',
            'avg_delay', 'total_recent_doses'
        ]
        
        importance = dict(zip(feature_names, self.model.feature_importances_))
        top_factors = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'adherence_probability': float(adherence_prob),
            'risk_level': risk_level,
            'message': message,
            'confidence': float(max(probability)),
            'top_factors': [{'factor': k, 'importance': float(v)} for k, v in top_factors],
            'recommendation': self._get_recommendation(adherence_prob, medication_logs)
        }
    
    def _get_recommendation(self, adherence_prob: float, logs: List[Dict]) -> str:
        """Generate personalized recommendation"""
        if adherence_prob < 0.5:
            return 'Set multiple reminders and consider using pill organizer'
        elif adherence_prob < 0.8:
            return 'Enable reminder notifications 15 minutes before scheduled time'
        else:
            return 'Continue current routine - adherence is good'
    
    def _generate_synthetic_data(self, n_samples=500) -> List[Dict]:
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        data = []
        
        for _ in range(n_samples):
            # Random features
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            is_weekend = 1 if day_of_week >= 5 else 0
            recent_adherence = np.random.beta(8, 2)  # Skewed toward high adherence
            current_streak = np.random.poisson(5)
            hours_since_last = np.random.exponential(12)
            missed_count = np.random.poisson(1)
            avg_delay = np.random.exponential(0.5)
            total_recent = np.random.randint(5, 20)
            
            features = [
                hour, day_of_week, is_weekend, recent_adherence,
                current_streak, hours_since_last, missed_count,
                avg_delay, total_recent
            ]
            
            # Generate label based on features (with some randomness)
            score = (
                recent_adherence * 0.4 +
                (current_streak / 10) * 0.2 +
                (1 - missed_count / 10) * 0.2 +
                (1 - is_weekend * 0.1) * 0.1 +
                (1 - avg_delay / 5) * 0.1
            )
            
            label = 1 if score + np.random.normal(0, 0.1) > 0.5 else 0
            
            data.append({'features': features, 'label': label})
        
        return data
    
    def save_model(self, path: str):
        """Save model to disk"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self, path: str):
        """Load model from disk"""
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            'model_type': 'Random Forest Classifier',
            'is_trained': self.is_trained,
            'n_estimators': self.model.n_estimators,
            'features': [
                'hour', 'day_of_week', 'is_weekend', 'recent_adherence',
                'current_streak', 'hours_since_last', 'missed_count',
                'avg_delay', 'total_recent_doses'
            ]
        }

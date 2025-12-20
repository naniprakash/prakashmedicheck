import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

# Get database URL from environment variable (for Render deployment)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///medicine_tracker.db')

# Fix for Render's postgres:// URL (SQLAlchemy needs postgresql://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Create engine
print(f"Connecting to database at: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    print("Database engine and session factory created.")
except Exception as e:
    print(f"FAILED to create database engine: {e}")
    raise


# Models
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(200), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False)
    name = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    medications = relationship("Medication", back_populates="user")

class Medication(Base):
    __tablename__ = 'medications'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    times = Column(Text, nullable=False)  # JSON string
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50))
    notes = Column(Text)
    image_path = Column(String(500))
    phone_number = Column(String(50))  # WhatsApp number
    reminder_minutes = Column(Integer, default=15)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication")

class MedicationLog(Base):
    __tablename__ = 'medication_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey('medications.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    scheduled_time = Column(String(50), nullable=False)
    taken_time = Column(String(50))
    status = Column(String(50), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    medication = relationship("Medication", back_populates="logs")

class MLPrediction(Base):
    __tablename__ = 'ml_predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey('medications.id'), nullable=False)
    prediction_type = Column(String(100), nullable=False)
    prediction_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DrugInteraction(Base):
    __tablename__ = 'drug_interactions'
    
    id = Column(Integer, primary_key=True, index=True)
    drug1 = Column(String(200), nullable=False)
    drug2 = Column(String(200), nullable=False)
    severity = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)

# Create tables
print("Creating database tables if they don't exist...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully.")
except Exception as e:
    print(f"FAILED to create database tables: {e}")
    raise


class MedicineDatabase:
    def __init__(self):
        self.session = SessionLocal()
    
    def get_or_create_user(self, google_id: str, email: str, name: str = None) -> User:
        """Get existing user or create a new one"""
        user = self.session.query(User).filter(User.google_id == google_id).first()
        if not user:
            user = User(google_id=google_id, email=email, name=name)
            self.session.add(user)
            self.session.commit()
            print(f"Created new user: {email}")
        return user

    def add_medication(self, user_id: int, name: str, dosage: str, frequency: str, 
                      times: list, start_date: str, end_date: str = None,
                      notes: str = None, image_path: str = None,
                      phone_number: str = None, reminder_minutes: int = 15) -> int:
        """Add a new medication"""
        med = Medication(
            user_id=user_id,
            name=name,
            dosage=dosage,
            frequency=frequency,
            times=json.dumps(times),
            start_date=start_date,
            end_date=end_date,
            notes=notes,
            image_path=image_path,
            phone_number=phone_number,
            reminder_minutes=reminder_minutes
        )
        self.session.add(med)
        self.session.commit()
        return med.id
    
    def get_all_medications(self, user_id: int) -> list:
        """Get all medications for a user"""
        meds = self.session.query(Medication).filter(Medication.user_id == user_id).order_by(Medication.created_at.desc()).all()
        return [self._medication_to_dict(med) for med in meds]
    
    def get_medication(self, med_id: int, user_id: int) -> dict:
        """Get a specific medication"""
        med = self.session.query(Medication).filter(Medication.id == med_id, Medication.user_id == user_id).first()
        return self._medication_to_dict(med) if med else None
    
    def update_medication(self, med_id: int, user_id: int, **kwargs) -> bool:
        """Update medication details"""
        med = self.session.query(Medication).filter(Medication.id == med_id, Medication.user_id == user_id).first()
        if not med:
            return False
        
        for key, value in kwargs.items():
            if key == 'times' and isinstance(value, list):
                value = json.dumps(value)
            setattr(med, key, value)
        
        self.session.commit()
        return True
    
    def delete_medication(self, med_id: int, user_id: int) -> bool:
        """Delete a medication"""
        med = self.session.query(Medication).filter(Medication.id == med_id, Medication.user_id == user_id).first()
        if not med:
            return False
        
        self.session.delete(med)
        self.session.commit()
        return True
    
    def log_medication(self, user_id: int, medication_id: int, scheduled_time: str, 
                      taken_time: str = None, status: str = 'pending',
                      notes: str = None) -> int:
        """Log medication intake"""
        log = MedicationLog(
            user_id=user_id,
            medication_id=medication_id,
            scheduled_time=scheduled_time,
            taken_time=taken_time,
            status=status,
            notes=notes
        )
        self.session.add(log)
        self.session.commit()
        return log.id
    
    def get_medication_logs(self, user_id: int, medication_id: int = None, 
                           start_date: str = None,
                           end_date: str = None) -> list:
        """Get medication logs with optional filters"""
        query = self.session.query(MedicationLog).filter(MedicationLog.user_id == user_id)
        
        if medication_id:
            query = query.filter(MedicationLog.medication_id == medication_id)
        if start_date:
            query = query.filter(MedicationLog.scheduled_time >= start_date)
        if end_date:
            query = query.filter(MedicationLog.scheduled_time <= end_date)
        
        logs = query.order_by(MedicationLog.scheduled_time.desc()).all()
        return [self._log_to_dict(log) for log in logs]
    
    def update_log_status(self, log_id: int, user_id: int, status: str, taken_time: str = None) -> bool:
        """Update medication log status"""
        log = self.session.query(MedicationLog).filter(MedicationLog.id == log_id, MedicationLog.user_id == user_id).first()
        if not log:
            return False
        
        log.status = status
        if taken_time:
            log.taken_time = taken_time
        
        self.session.commit()
        return True
    
    def save_ml_prediction(self, medication_id: int, prediction_type: str,
                          prediction_value: float, confidence: float) -> int:
        """Save ML model prediction"""
        pred = MLPrediction(
            medication_id=medication_id,
            prediction_type=prediction_type,
            prediction_value=prediction_value,
            confidence=confidence
        )
        self.session.add(pred)
        self.session.commit()
        return pred.id
    
    def get_adherence_stats(self, user_id: int, medication_id: int = None, days: int = 30) -> dict:
        """Calculate adherence statistics"""
        from datetime import timedelta
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        query = self.session.query(MedicationLog).filter(
            MedicationLog.user_id == user_id,
            MedicationLog.scheduled_time >= start_date
        )
        
        if medication_id:
            query = query.filter(MedicationLog.medication_id == medication_id)
        
        logs = query.all()
        
        total = len(logs)
        taken = sum(1 for log in logs if log.status == 'taken')
        missed = sum(1 for log in logs if log.status == 'missed')
        pending = sum(1 for log in logs if log.status == 'pending')
        
        adherence_rate = (taken / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'taken': taken,
            'missed': missed,
            'pending': pending,
            'adherence_rate': adherence_rate
        }
    
    def _medication_to_dict(self, med) -> dict:
        """Convert medication object to dictionary"""
        return {
            'id': med.id,
            'name': med.name,
            'dosage': med.dosage,
            'frequency': med.frequency,
            'times': med.times,  # Already JSON string
            'start_date': med.start_date,
            'end_date': med.end_date,
            'notes': med.notes,
            'image_path': med.image_path,
            'phone_number': med.phone_number,
            'reminder_minutes': med.reminder_minutes,
            'created_at': med.created_at.isoformat() if med.created_at else None
        }
    
    def _log_to_dict(self, log) -> dict:
        """Convert log object to dictionary"""
        return {
            'id': log.id,
            'medication_id': log.medication_id,
            'scheduled_time': log.scheduled_time,
            'taken_time': log.taken_time,
            'status': log.status,
            'notes': log.notes,
            'created_at': log.created_at.isoformat() if log.created_at else None
        }

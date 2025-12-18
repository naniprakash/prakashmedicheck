import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class MedicineDatabase:
    def __init__(self, db_path='medicine_tracker.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Medications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                dosage TEXT NOT NULL,
                frequency TEXT NOT NULL,
                times TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                notes TEXT,
                image_path TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Medication logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medication_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medication_id INTEGER NOT NULL,
                scheduled_time TEXT NOT NULL,
                taken_time TEXT,
                status TEXT NOT NULL,
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medication_id) REFERENCES medications (id)
            )
        ''')
        
        # ML predictions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ml_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medication_id INTEGER NOT NULL,
                prediction_type TEXT NOT NULL,
                prediction_value REAL NOT NULL,
                confidence REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medication_id) REFERENCES medications (id)
            )
        ''')
        
        # Drug interactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS drug_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                drug1 TEXT NOT NULL,
                drug2 TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_medication(self, name: str, dosage: str, frequency: str, 
                      times: List[str], start_date: str, end_date: Optional[str] = None,
                      notes: Optional[str] = None, image_path: Optional[str] = None) -> int:
        """Add a new medication"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO medications (name, dosage, frequency, times, start_date, end_date, notes, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, dosage, frequency, json.dumps(times), start_date, end_date, notes, image_path))
        
        med_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return med_id
    
    def get_all_medications(self) -> List[Dict]:
        """Get all medications"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM medications ORDER BY created_at DESC')
        rows = cursor.fetchall()
        
        medications = []
        for row in rows:
            med = dict(row)
            med['times'] = json.loads(med['times'])
            medications.append(med)
        
        conn.close()
        return medications
    
    def get_medication(self, med_id: int) -> Optional[Dict]:
        """Get a specific medication"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM medications WHERE id = ?', (med_id,))
        row = cursor.fetchone()
        
        if row:
            med = dict(row)
            med['times'] = json.loads(med['times'])
            conn.close()
            return med
        
        conn.close()
        return None
    
    def update_medication(self, med_id: int, **kwargs) -> bool:
        """Update medication details"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build update query dynamically
        fields = []
        values = []
        for key, value in kwargs.items():
            if key == 'times' and isinstance(value, list):
                value = json.dumps(value)
            fields.append(f"{key} = ?")
            values.append(value)
        
        values.append(med_id)
        query = f"UPDATE medications SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def delete_medication(self, med_id: int) -> bool:
        """Delete a medication"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM medications WHERE id = ?', (med_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def log_medication(self, medication_id: int, scheduled_time: str, 
                      taken_time: Optional[str] = None, status: str = 'pending',
                      notes: Optional[str] = None) -> int:
        """Log medication intake"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO medication_logs (medication_id, scheduled_time, taken_time, status, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (medication_id, scheduled_time, taken_time, status, notes))
        
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return log_id
    
    def get_medication_logs(self, medication_id: Optional[int] = None, 
                           start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> List[Dict]:
        """Get medication logs with optional filters"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM medication_logs WHERE 1=1'
        params = []
        
        if medication_id:
            query += ' AND medication_id = ?'
            params.append(medication_id)
        
        if start_date:
            query += ' AND scheduled_time >= ?'
            params.append(start_date)
        
        if end_date:
            query += ' AND scheduled_time <= ?'
            params.append(end_date)
        
        query += ' ORDER BY scheduled_time DESC'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        logs = [dict(row) for row in rows]
        conn.close()
        
        return logs
    
    def update_log_status(self, log_id: int, status: str, taken_time: Optional[str] = None) -> bool:
        """Update medication log status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if taken_time:
            cursor.execute('''
                UPDATE medication_logs SET status = ?, taken_time = ? WHERE id = ?
            ''', (status, taken_time, log_id))
        else:
            cursor.execute('''
                UPDATE medication_logs SET status = ? WHERE id = ?
            ''', (status, log_id))
        
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def save_ml_prediction(self, medication_id: int, prediction_type: str,
                          prediction_value: float, confidence: float) -> int:
        """Save ML model prediction"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ml_predictions (medication_id, prediction_type, prediction_value, confidence)
            VALUES (?, ?, ?, ?)
        ''', (medication_id, prediction_type, prediction_value, confidence))
        
        pred_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return pred_id
    
    def get_adherence_stats(self, medication_id: Optional[int] = None, days: int = 30) -> Dict:
        """Calculate adherence statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        query = '''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
                SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM medication_logs
            WHERE scheduled_time >= ?
        '''
        
        params = [start_date]
        if medication_id:
            query += ' AND medication_id = ?'
            params.append(medication_id)
        
        cursor.execute(query, params)
        row = cursor.fetchone()
        
        stats = dict(row)
        if stats['total'] > 0:
            stats['adherence_rate'] = (stats['taken'] / stats['total']) * 100
        else:
            stats['adherence_rate'] = 0
        
        conn.close()
        return stats

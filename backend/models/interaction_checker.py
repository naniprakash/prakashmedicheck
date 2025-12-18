from typing import Dict, List, Set
import json

class InteractionChecker:
    """
    Drug interaction detection system
    Uses a knowledge base to check for dangerous drug combinations
    """
    
    def __init__(self, interaction_db_path=None):
        self.interactions = self._load_interaction_database(interaction_db_path)
    
    def _load_interaction_database(self, db_path=None) -> Dict:
        """
        Load drug interaction database
        In production, this would load from a comprehensive medical database
        """
        # Sample interaction database
        interactions = {
            ('Aspirin', 'Warfarin'): {
                'severity': 'high',
                'description': 'Increased risk of bleeding. Monitor closely.',
                'recommendation': 'Consult doctor before combining these medications.'
            },
            ('Ibuprofen', 'Aspirin'): {
                'severity': 'medium',
                'description': 'May reduce effectiveness of aspirin for heart protection.',
                'recommendation': 'Take ibuprofen at least 8 hours before or 30 minutes after aspirin.'
            },
            ('Lisinopril', 'Ibuprofen'): {
                'severity': 'medium',
                'description': 'NSAIDs may reduce effectiveness of blood pressure medication.',
                'recommendation': 'Monitor blood pressure regularly.'
            },
            ('Metformin', 'Alcohol'): {
                'severity': 'high',
                'description': 'Increased risk of lactic acidosis.',
                'recommendation': 'Avoid excessive alcohol consumption.'
            },
            ('Simvastatin', 'Grapefruit'): {
                'severity': 'high',
                'description': 'Grapefruit can increase drug levels, raising risk of side effects.',
                'recommendation': 'Avoid grapefruit and grapefruit juice.'
            },
            ('Warfarin', 'Acetaminophen'): {
                'severity': 'low',
                'description': 'May slightly increase bleeding risk with prolonged use.',
                'recommendation': 'Safe for occasional use. Monitor if using regularly.'
            },
            ('Levothyroxine', 'Calcium'): {
                'severity': 'medium',
                'description': 'Calcium can reduce absorption of thyroid medication.',
                'recommendation': 'Take levothyroxine at least 4 hours apart from calcium.'
            },
            ('Metoprolol', 'Albuterol'): {
                'severity': 'medium',
                'description': 'Beta-blockers may reduce effectiveness of albuterol.',
                'recommendation': 'Monitor breathing and heart rate.'
            },
            ('Prednisone', 'Ibuprofen'): {
                'severity': 'medium',
                'description': 'Increased risk of stomach ulcers and bleeding.',
                'recommendation': 'Take with food. Consider stomach protection medication.'
            },
            ('Omeprazole', 'Clopidogrel'): {
                'severity': 'high',
                'description': 'May reduce effectiveness of clopidogrel.',
                'recommendation': 'Consult doctor about alternative acid reducer.'
            }
        }
        
        return interactions
    
    def check_interactions(self, medications: List[str]) -> Dict:
        """
        Check for interactions between multiple medications
        Returns list of interactions found with severity levels
        """
        interactions_found = []
        warnings = []
        
        # Normalize medication names
        meds = [med.strip().title() for med in medications]
        
        # Check all pairs
        for i, med1 in enumerate(meds):
            for med2 in meds[i+1:]:
                # Check both orderings
                interaction = self._get_interaction(med1, med2)
                
                if interaction:
                    interactions_found.append({
                        'drug1': med1,
                        'drug2': med2,
                        'severity': interaction['severity'],
                        'description': interaction['description'],
                        'recommendation': interaction['recommendation']
                    })
        
        # Sort by severity
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        interactions_found.sort(key=lambda x: severity_order.get(x['severity'], 3))
        
        # Generate summary
        high_risk = sum(1 for i in interactions_found if i['severity'] == 'high')
        medium_risk = sum(1 for i in interactions_found if i['severity'] == 'medium')
        low_risk = sum(1 for i in interactions_found if i['severity'] == 'low')
        
        if high_risk > 0:
            overall_risk = 'high'
            message = f'⚠️ {high_risk} high-risk interaction(s) detected. Consult your doctor immediately.'
        elif medium_risk > 0:
            overall_risk = 'medium'
            message = f'⚡ {medium_risk} moderate interaction(s) detected. Review with your pharmacist.'
        elif low_risk > 0:
            overall_risk = 'low'
            message = f'ℹ️ {low_risk} minor interaction(s) detected. Generally safe but monitor.'
        else:
            overall_risk = 'none'
            message = '✅ No known interactions detected between these medications.'
        
        return {
            'overall_risk': overall_risk,
            'message': message,
            'total_interactions': len(interactions_found),
            'high_risk_count': high_risk,
            'medium_risk_count': medium_risk,
            'low_risk_count': low_risk,
            'interactions': interactions_found,
            'medications_checked': meds
        }
    
    def _get_interaction(self, med1: str, med2: str) -> Dict:
        """Get interaction between two medications"""
        # Check both orderings
        key1 = (med1, med2)
        key2 = (med2, med1)
        
        if key1 in self.interactions:
            return self.interactions[key1]
        elif key2 in self.interactions:
            return self.interactions[key2]
        
        return None
    
    def check_single_interaction(self, med1: str, med2: str) -> Dict:
        """Check interaction between two specific medications"""
        interaction = self._get_interaction(med1.strip().title(), med2.strip().title())
        
        if interaction:
            return {
                'has_interaction': True,
                'drug1': med1,
                'drug2': med2,
                **interaction
            }
        else:
            return {
                'has_interaction': False,
                'drug1': med1,
                'drug2': med2,
                'message': 'No known interaction between these medications.'
            }
    
    def get_medication_warnings(self, medication: str) -> List[str]:
        """Get all known interactions for a specific medication"""
        med = medication.strip().title()
        warnings = []
        
        for (drug1, drug2), interaction in self.interactions.items():
            if drug1 == med or drug2 == med:
                other_drug = drug2 if drug1 == med else drug1
                warnings.append({
                    'interacts_with': other_drug,
                    'severity': interaction['severity'],
                    'description': interaction['description']
                })
        
        return warnings
    
    def add_interaction(self, drug1: str, drug2: str, severity: str, 
                       description: str, recommendation: str):
        """Add a new interaction to the database"""
        key = (drug1.strip().title(), drug2.strip().title())
        self.interactions[key] = {
            'severity': severity,
            'description': description,
            'recommendation': recommendation
        }
    
    def get_database_stats(self) -> Dict:
        """Get statistics about the interaction database"""
        total = len(self.interactions)
        high = sum(1 for i in self.interactions.values() if i['severity'] == 'high')
        medium = sum(1 for i in self.interactions.values() if i['severity'] == 'medium')
        low = sum(1 for i in self.interactions.values() if i['severity'] == 'low')
        
        return {
            'total_interactions': total,
            'high_severity': high,
            'medium_severity': medium,
            'low_severity': low,
            'unique_medications': len(set(
                drug for pair in self.interactions.keys() for drug in pair
            ))
        }

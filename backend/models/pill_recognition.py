import numpy as np
from PIL import Image
import io
import base64
from typing import Dict

class PillRecognitionModel:
    """
    Simplified pill recognition model (demo version without TensorFlow)
    For production, use the full TensorFlow version
    """
    
    def __init__(self, model_path=None):
        self.class_names = self._get_pill_classes()
        self.img_size = (224, 224)
    
    def _get_pill_classes(self):
        """Define common pill/medication classes"""
        return [
            'Aspirin', 'Ibuprofen', 'Acetaminophen', 'Amoxicillin',
            'Lisinopril', 'Metformin', 'Atorvastatin', 'Amlodipine',
            'Omeprazole', 'Losartan', 'Gabapentin', 'Hydrochlorothiazide',
            'Levothyroxine', 'Metoprolol', 'Simvastatin', 'Prednisone',
            'Albuterol', 'Furosemide', 'Pantoprazole', 'Sertraline',
            'Unknown'
        ]
    
    def preprocess_image(self, image_data):
        """Preprocess image for model input"""
        # Handle different input types
        if isinstance(image_data, str):
            # Base64 encoded image
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        elif isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data))
        else:
            image = image_data
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size
        image = image.resize(self.img_size)
        
        return image
    
    def predict(self, image_data) -> Dict:
        """
        Predict pill type from image (demo version)
        Returns: dict with pill name, confidence, and top predictions
        """
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            
            # Demo: Use simple color-based heuristic
            color = self._extract_color(image_data)
            
            # Map colors to common medications (demo logic)
            color_to_med = {
                'white': ('Acetaminophen', 0.75),
                'red': ('Ibuprofen', 0.70),
                'blue': ('Lisinopril', 0.72),
                'yellow': ('Prednisone', 0.68),
                'green': ('Omeprazole', 0.65),
                'mixed': ('Aspirin', 0.60)
            }
            
            pill_name, confidence = color_to_med.get(color, ('Unknown', 0.50))
            
            # Generate top 3 predictions
            results = {
                'pill_name': pill_name,
                'confidence': confidence,
                'top_predictions': [
                    {'name': pill_name, 'confidence': confidence},
                    {'name': 'Aspirin', 'confidence': confidence - 0.15},
                    {'name': 'Ibuprofen', 'confidence': confidence - 0.25}
                ]
            }
            
            # Add metadata
            results['success'] = True
            results['message'] = 'Pill identified successfully (demo mode)'
            
            # Add warning for low confidence
            if results['confidence'] < 0.5:
                results['warning'] = 'Low confidence - please verify manually'
            
            return results
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to process image'
            }
    
    def predict_with_features(self, image_data) -> Dict:
        """Enhanced prediction with visual features extraction"""
        result = self.predict(image_data)
        
        if result['success']:
            result['features'] = {
                'dominant_color': self._extract_color(image_data),
                'estimated_shape': 'round',
                'size_category': 'medium'
            }
        
        return result
    
    def _extract_color(self, image_data) -> str:
        """Extract dominant color from pill image"""
        try:
            if isinstance(image_data, str):
                if 'base64,' in image_data:
                    image_data = image_data.split('base64,')[1]
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = image_data
            
            # Resize for faster processing
            image = image.resize((50, 50))
            
            # Get dominant color
            pixels = np.array(image)
            avg_color = pixels.mean(axis=(0, 1))
            
            # Simple color classification
            r, g, b = avg_color[:3]
            
            if r > 200 and g > 200 and b > 200:
                return 'white'
            elif r > 150 and g < 100 and b < 100:
                return 'red'
            elif r < 100 and g < 100 and b > 150:
                return 'blue'
            elif r > 150 and g > 150 and b < 100:
                return 'yellow'
            elif r < 100 and g > 150 and b < 100:
                return 'green'
            else:
                return 'mixed'
                
        except:
            return 'unknown'
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            'model_type': 'Demo Version (Color-based heuristic)',
            'input_size': self.img_size,
            'num_classes': len(self.class_names),
            'classes': self.class_names,
            'note': 'This is a demo version. For production, install TensorFlow and use the full ML model.'
        }

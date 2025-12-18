"""Image processing capabilities for RAG system"""

from PIL import Image
import io
import base64
from typing import Dict, Any, Tuple, Optional
import numpy as np


class ImageProcessor:
    """Process images from screenshots for crew analysis"""
    
    def __init__(self):
        self.supported_formats = ['PNG', 'JPEG', 'JPG', 'GIF']
        
    def process_base64_image(self, base64_string: str) -> Dict[str, Any]:
        """Process an image from base64 string"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Convert base64 to image
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to numpy array for analysis
            np_image = np.array(image)
            
            # Basic image analysis
            height, width = np_image.shape[:2]
            
            return {
                'status': 'success',
                'text_content': '',  # OCR would go here if tesseract is available
                'metadata': {
                    'width': width,
                    'height': height,
                    'format': image.format,
                    'mode': image.mode,
                    'size_bytes': len(image_data)
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': f"Image processing failed: {str(e)}",
                'text_content': '',
                'metadata': {}
            }
    
    def extract_image_features(self, image_data: bytes) -> Dict[str, Any]:
        """Extract features from image data"""
        try:
            image = Image.open(io.BytesIO(image_data))
            np_image = np.array(image)
            
            # Calculate basic statistics
            if len(np_image.shape) == 3:
                mean_color = np_image.mean(axis=(0, 1))
            else:
                mean_color = [np_image.mean()]
            
            return {
                'dimensions': np_image.shape,
                'mean_color': mean_color.tolist(),
                'format': image.format,
                'mode': image.mode
            }
        except Exception as e:
            return {'error': str(e)}

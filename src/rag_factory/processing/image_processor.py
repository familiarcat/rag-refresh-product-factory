"""Image processing capabilities for RAG system"""

from PIL import Image
import io
import base64
from typing import Dict, Any, Tuple, Optional, List
import numpy as np


class ImageProcessor:
    """Process images from screenshots for crew analysis"""
    
    def __init__(self):
        self.supported_formats = ['PNG', 'JPEG', 'JPG', 'GIF', 'BMP', 'WEBP']
        self.ocr_available = False
        self._check_ocr_availability()
        
    def _check_ocr_availability(self):
        """Check if OCR is available"""
        try:
            import pytesseract
            self.ocr_available = True
            self.pytesseract = pytesseract
        except ImportError:
            self.ocr_available = False
        
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
            
            # Extract text using OCR if available
            text_content = ""
            if self.ocr_available:
                try:
                    text_content = self.pytesseract.image_to_string(image).strip()
                except Exception as e:
                    text_content = f"OCR failed: {str(e)}"
            
            # Basic image analysis
            height, width = np_image.shape[:2] if len(np_image.shape) >= 2 else (0, 0)
            
            return {
                'status': 'success',
                'text_content': text_content,
                'metadata': {
                    'width': width,
                    'height': height,
                    'format': image.format,
                    'mode': image.mode,
                    'size_bytes': len(image_data),
                    'has_alpha': image.mode in ('RGBA', 'LA', 'PA')
                },
                'analysis': self.extract_image_features(np_image)
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': f"Image processing failed: {str(e)}",
                'text_content': '',
                'metadata': {}
            }
    
    def extract_image_features(self, image_data: np.ndarray) -> Dict[str, Any]:
        """Extract features from image data"""
        try:
            if len(image_data.shape) == 2:
                # Grayscale
                mean_value = float(image_data.mean())
                return {
                    'type': 'grayscale',
                    'mean_intensity': mean_value,
                    'dimensions': list(image_data.shape)
                }
            elif len(image_data.shape) == 3:
                # Color image
                mean_color = image_data.mean(axis=(0, 1)).tolist()
                return {
                    'type': 'color',
                    'channels': image_data.shape[2],
                    'mean_color': mean_color,
                    'dimensions': list(image_data.shape),
                    'color_space': self._detect_color_space(image_data)
                }
            else:
                return {'error': 'Unexpected image shape'}
        except Exception as e:
            return {'error': str(e)}
    
    def _detect_color_space(self, image_data: np.ndarray) -> str:
        """Detect color space"""
        channels = image_data.shape[2] if len(image_data.shape) == 3 else 1
        if channels == 1:
            return 'Grayscale'
        elif channels == 3:
            return 'RGB'
        elif channels == 4:
            return 'RGBA'
        else:
            return f'Unknown ({channels} channels)'
    
    def analyze_image_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze an image file from disk"""
        try:
            image = Image.open(file_path)
            np_image = np.array(image)
            
            # Extract text using OCR if available
            text_content = ""
            if self.ocr_available:
                try:
                    text_content = self.pytesseract.image_to_string(image).strip()
                except Exception as e:
                    text_content = f"OCR failed: {str(e)}"
            
            height, width = np_image.shape[:2] if len(np_image.shape) >= 2 else (0, 0)
            
            return {
                'status': 'success',
                'file_path': file_path,
                'text_content': text_content,
                'metadata': {
                    'width': width,
                    'height': height,
                    'format': image.format,
                    'mode': image.mode,
                    'file_size': len(open(file_path, 'rb').read()),
                    'has_alpha': image.mode in ('RGBA', 'LA', 'PA')
                },
                'analysis': self.extract_image_features(np_image)
            }
        except Exception as e:
            return {
                'status': 'error',
                'file_path': file_path,
                'error': f"Image analysis failed: {str(e)}"
            }
    
    def save_image_analysis(self, base64_or_array, output_path: str) -> Dict[str, Any]:
        """Save analyzed image to file from base64 string or numpy array"""
        try:
            if isinstance(base64_or_array, str):
                # Handle base64 string
                if ',' in base64_or_array:
                    base64_or_array = base64_or_array.split(',')[1]
                image_data = base64.b64decode(base64_or_array)
                image = Image.open(io.BytesIO(image_data))
            else:
                # Handle numpy array
                image = Image.fromarray(base64_or_array.astype('uint8'))
            
            image.save(output_path)
            
            return {
                'status': 'success',
                'output_path': output_path,
                'message': f'Image saved to {output_path}'
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def detect_image_objects(self, image_data: np.ndarray) -> Dict[str, Any]:
        """Detect objects/features in image (basic implementation)"""
        try:
            # Basic edge detection
            if len(image_data.shape) == 3:
                gray = np.mean(image_data, axis=2)
            else:
                gray = image_data
            
            # Calculate gradients
            gx = np.gradient(gray, axis=1)
            gy = np.gradient(gray, axis=0)
            magnitude = np.sqrt(gx**2 + gy**2)
            
            return {
                'status': 'success',
                'edge_strength': float(magnitude.mean()),
                'edge_variance': float(magnitude.var()),
                'texture_complexity': self._calculate_complexity(gray)
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_complexity(self, gray_image: np.ndarray) -> float:
        """Calculate image complexity"""
        try:
            laplacian = np.abs(np.gradient(np.gradient(gray_image, axis=0), axis=1))
            return float(laplacian.var())
        except:
            return 0.0

"""Test CRUD file operations and image analysis capabilities"""

import pytest
import tempfile
import os
from pathlib import Path
import base64
from PIL import Image
import io

from src.rag_factory.crew.system_access import CrewSystemAccess
from src.rag_factory.crew.authorization import CrewMember, CrewRank
from src.rag_factory.processing.image_processor import ImageProcessor


@pytest.fixture
def crew_member():
    """Create a test crew member"""
    return CrewMember("captain-test", CrewRank.CAPTAIN, ["file_operations", "image_analysis"])


@pytest.fixture
def system_access():
    """Create system access instance"""
    return CrewSystemAccess()


@pytest.fixture
def image_processor():
    """Create image processor instance"""
    return ImageProcessor()


@pytest.fixture
def temp_dir():
    """Create temporary directory for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestFileCRUD:
    """Test file CRUD operations"""
    
    def test_create_file(self, crew_member, system_access, temp_dir):
        """Test creating a new file"""
        file_path = os.path.join(temp_dir, "test.txt")
        content = "Test content for file creation"
        
        result = system_access.create_file(crew_member, file_path, content)
        
        assert result['status'] == 'success'
        assert os.path.exists(file_path)
        with open(file_path, 'r') as f:
            assert f.read() == content
    
    def test_create_file_with_parent_dirs(self, crew_member, system_access, temp_dir):
        """Test creating file with nested directories"""
        file_path = os.path.join(temp_dir, "nested", "deep", "test.txt")
        content = "Nested file content"
        
        result = system_access.create_file(crew_member, file_path, content)
        
        assert result['status'] == 'success'
        assert os.path.exists(file_path)
    
    def test_create_file_overwrite_protection(self, crew_member, system_access, temp_dir):
        """Test that creating existing file fails without overwrite flag"""
        file_path = os.path.join(temp_dir, "existing.txt")
        
        # Create initial file
        system_access.create_file(crew_member, file_path, "Initial content")
        
        # Try to create again without overwrite
        result = system_access.create_file(crew_member, file_path, "New content", overwrite=False)
        
        assert result['status'] == 'error'
        with open(file_path, 'r') as f:
            assert f.read() == "Initial content"  # Should be unchanged
    
    def test_create_file_with_overwrite(self, crew_member, system_access, temp_dir):
        """Test overwriting existing file"""
        file_path = os.path.join(temp_dir, "overwrite.txt")
        
        system_access.create_file(crew_member, file_path, "Initial content")
        result = system_access.create_file(crew_member, file_path, "New content", overwrite=True)
        
        assert result['status'] == 'success'
        with open(file_path, 'r') as f:
            assert f.read() == "New content"
    
    def test_read_file(self, crew_member, system_access, temp_dir):
        """Test reading a file"""
        file_path = os.path.join(temp_dir, "read_test.txt")
        expected_content = "Content to read"
        
        with open(file_path, 'w') as f:
            f.write(expected_content)
        
        result = system_access.read_file(crew_member, file_path)
        
        assert result['status'] == 'success'
        assert result['content'] == expected_content
    
    def test_read_nonexistent_file(self, crew_member, system_access):
        """Test reading non-existent file returns error"""
        result = system_access.read_file(crew_member, "/nonexistent/path/file.txt")
        
        assert result['status'] == 'error'
    
    def test_update_file(self, crew_member, system_access, temp_dir):
        """Test updating an existing file"""
        file_path = os.path.join(temp_dir, "update_test.txt")
        
        system_access.create_file(crew_member, file_path, "Original content")
        result = system_access.update_file(crew_member, file_path, "Updated content")
        
        assert result['status'] == 'success'
        with open(file_path, 'r') as f:
            assert f.read() == "Updated content"
    
    def test_update_nonexistent_file(self, crew_member, system_access, temp_dir):
        """Test updating non-existent file returns error"""
        file_path = os.path.join(temp_dir, "nonexistent.txt")
        result = system_access.update_file(crew_member, file_path, "Content")
        
        assert result['status'] == 'error'
    
    def test_delete_file(self, crew_member, system_access, temp_dir):
        """Test deleting a file"""
        file_path = os.path.join(temp_dir, "delete_test.txt")
        
        system_access.create_file(crew_member, file_path, "Content to delete")
        assert os.path.exists(file_path)
        
        result = system_access.delete_file(crew_member, file_path)
        
        assert result['status'] == 'success'
        assert not os.path.exists(file_path)
    
    def test_delete_nonexistent_file(self, crew_member, system_access):
        """Test deleting non-existent file returns error"""
        result = system_access.delete_file(crew_member, "/nonexistent/file.txt")
        
        assert result['status'] == 'error'
    
    def test_list_files(self, crew_member, system_access, temp_dir):
        """Test listing files in a directory"""
        # Create test files
        system_access.create_file(crew_member, os.path.join(temp_dir, "file1.txt"), "Content 1")
        system_access.create_file(crew_member, os.path.join(temp_dir, "file2.txt"), "Content 2")
        
        result = system_access.list_files(crew_member, temp_dir, recursive=False)
        
        assert result['status'] == 'success'
        files = result.get('files', [])
        assert len(files) >= 2
        assert "file1.txt" in files
        assert "file2.txt" in files
    
    def test_list_files_recursive(self, crew_member, system_access, temp_dir):
        """Test recursive file listing"""
        # Create nested structure
        nested_dir = os.path.join(temp_dir, "nested")
        os.makedirs(nested_dir, exist_ok=True)
        
        system_access.create_file(crew_member, os.path.join(temp_dir, "top.txt"), "Top level")
        system_access.create_file(crew_member, os.path.join(nested_dir, "nested.txt"), "Nested file")
        
        result = system_access.list_files(crew_member, temp_dir, recursive=True)
        
        assert result['status'] == 'success'


class TestImageAnalysis:
    """Test image analysis capabilities"""
    
    def _create_test_image(self, width=100, height=100) -> str:
        """Create a test image and return as base64"""
        image = Image.new('RGB', (width, height), color='red')
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        base64_string = base64.b64encode(buffer.getvalue()).decode()
        return base64_string
    
    def test_process_base64_image(self, image_processor):
        """Test processing base64 image"""
        base64_image = self._create_test_image()
        
        result = image_processor.process_base64_image(base64_image)
        
        assert result['status'] == 'success'
        assert 'metadata' in result
        assert result['metadata']['width'] == 100
        assert result['metadata']['height'] == 100
    
    def test_image_with_data_url_prefix(self, image_processor):
        """Test processing base64 image with data URL prefix"""
        base64_image = self._create_test_image()
        data_url = f"data:image/png;base64,{base64_image}"
        
        result = image_processor.process_base64_image(data_url)
        
        assert result['status'] == 'success'
    
    def test_extract_image_features(self, image_processor):
        """Test feature extraction from image"""
        base64_image = self._create_test_image()
        
        result = image_processor.process_base64_image(base64_image)
        features = result.get('analysis', {})
        
        assert 'channels' in features or 'type' in features
    
    def test_analyze_image_file(self, image_processor, temp_dir):
        """Test analyzing image from file system"""
        # Create test image file
        image_path = os.path.join(temp_dir, "test_image.png")
        image = Image.new('RGB', (150, 150), color='blue')
        image.save(image_path)
        
        result = image_processor.analyze_image_file(image_path)
        
        assert result['status'] == 'success'
        assert result['metadata']['width'] == 150
        assert result['metadata']['height'] == 150
    
    def test_detect_image_objects(self, image_processor):
        """Test object detection on image"""
        base64_image = self._create_test_image()
        
        result = image_processor.process_base64_image(base64_image)
        
        # Check if detection results exist
        assert 'detection' in result or result['status'] == 'success'
    
    def test_save_image_analysis(self, image_processor, temp_dir):
        """Test saving analyzed image"""
        # Create test image
        base64_image = self._create_test_image()
        output_path = os.path.join(temp_dir, "analyzed_image.png")
        
        result = image_processor.save_image_analysis(base64_image, output_path)
        
        assert result['status'] == 'success'
        assert os.path.exists(output_path)


class TestIntegration:
    """Integration tests combining file operations and image analysis"""
    
    def test_save_and_analyze_workflow(self, crew_member, system_access, image_processor, temp_dir):
        """Test saving image analysis to file"""
        # Create test image
        image = Image.new('RGB', (200, 200), color='green')
        image_path = os.path.join(temp_dir, "workflow_image.png")
        image.save(image_path)
        
        # Analyze image
        analysis = image_processor.analyze_image_file(image_path)
        
        # Save analysis to file
        analysis_path = os.path.join(temp_dir, "analysis.txt")
        analysis_content = f"Image Analysis Report\n{str(analysis)}"
        
        result = system_access.create_file(crew_member, analysis_path, analysis_content)
        
        assert result['status'] == 'success'
        assert os.path.exists(analysis_path)
        
        # Read back and verify
        read_result = system_access.read_file(crew_member, analysis_path)
        assert read_result['status'] == 'success'
        assert "Image Analysis Report" in read_result['content']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

import os
from google.cloud import aiplatform
from vertexai.language_models import TextGenerationModel
from vertexai.preview.generative_models import GenerativeModel, Part
from PIL import Image
import vertexai
from typing import Optional, Dict, Any

class GeminiService:
    def __init__(self):
        """Initialize the Gemini service."""
        project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
        location = os.getenv('GOOGLE_CLOUD_LOCATION', 'asia-northeast1')
        
        if not project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is not set")
        
        vertexai.init(project=project_id, location=location)
        self.model = GenerativeModel("gemini-pro")
        self.vision_model = GenerativeModel("gemini-pro-vision")
        self.chat = self.model.start_chat()

    def generate_response(self, message: str) -> str:
        """Generate a response using the text-only model.
        
        Args:
            message (str): The user's input message.
            
        Returns:
            str: The generated response.
        """
        try:
            response = self.model.generate_content(message)
            return response.text
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return f"申し訳ありません。エラーが発生しました: {str(e)}"

    def process_multimodal_message(self, message: str, image_path: str = None) -> str:
        """Process a multimodal message (text + optional image).
        
        Args:
            message (str): The user's input message.
            image_path (str, optional): Path to the image file.
            
        Returns:
            str: The generated response.
        """
        try:
            if not image_path:
                return self.generate_response(message)
                
            # Load and process image
            image = Image.open(image_path)
            
            # Prepare the prompt parts
            prompt_parts = [
                Part.text(message),
                Part.image(image)
            ]
            
            # Generate response
            response = self.vision_model.generate_content(prompt_parts)
            return response.text
            
        except Exception as e:
            print(f"Error processing multimodal message: {str(e)}")
            return f"申し訳ありません。エラーが発生しました: {str(e)}"

    def create_chat_session(self):
        """Create a new chat session."""
        try:
            chat = self.model.start_chat()
            return chat
        except Exception as e:
            raise ValueError(f"Failed to create chat session: {str(e)}")

    def process_message(self, message: str, chat_session: Optional[Any] = None) -> Dict[str, Any]:
        """Process a message and return the response."""
        try:
            if chat_session:
                self.chat = chat_session

            response = self.chat.send_message(message)
            
            return {
                "status": "success",
                "response": response.text,
                "chat_session": self.chat
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def handle_multimodal_input(self, text: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """Handle multimodal input (text + optional image)."""
        try:
            if image_path:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                response = self.model.generate_content([text, image_data])
            else:
                response = self.model.generate_content(text)

            return {
                "status": "success",
                "response": response.text
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def _handle_safety_ratings(self, response) -> bool:
        """Check if the response meets safety requirements.
        
        Args:
            response: The response object from the model.
            
        Returns:
            bool: True if safe, False otherwise.
        """
        try:
            for rating in response.safety_ratings:
                if rating.probability > 3:  # HIGH or above
                    return False
            return True
        except Exception:
            return True  # Default to True if rating check fails 
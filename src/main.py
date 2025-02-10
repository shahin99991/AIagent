from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from .gemini_service import GeminiService

app = Flask(__name__, static_folder='static', template_folder='templates')
load_dotenv()

GOOGLE_CLOUD_LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'asia-northeast1')

gemini_service = GeminiService()

@app.route('/favicon.ico')
def favicon():
    """Favicon endpoint."""
    return send_from_directory(app.static_folder, 'favicon.ico')

@app.route("/", methods=["GET"])
def chat_page():
    """Chat interface page."""
    return render_template('chat.html')

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "message": "AI Agent is running"}), 200

@app.route('/chat', methods=['POST'])
def chat():
    """Handle text-only chat requests."""
    try:
        data = request.get_json()
        message = data.get('message', '')
        response = gemini_service.generate_response(message)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/multimodal_chat', methods=['POST'])
def multimodal_chat():
    """Handle multimodal requests (text + optional image)."""
    try:
        data = request.get_json()
        message = data.get('message')
        image_path = data.get('image_path')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        response = gemini_service.process_multimodal_message(message, image_path)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files."""
    return send_from_directory('static', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False) 
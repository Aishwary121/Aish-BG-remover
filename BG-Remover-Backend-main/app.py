from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
from io import BytesIO
import os

app = Flask(__name__)
CORS(app, origins=["*"])

# Global variables for lazy loading
remove_bg_function = None
Image = None

def load_ml_dependencies():
    """Load heavy ML dependencies only when needed"""
    global remove_bg_function, Image
    if remove_bg_function is None:
        print("Loading ML dependencies...")
        from rembg import remove
        from PIL import Image as PILImage
        remove_bg_function = remove
        Image = PILImage
        print("ML dependencies loaded!")

@app.route('/')
def home():
    return "Hello from Aish BG Remover!"

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/remove-bg', methods=['POST', 'OPTIONS'])
def remove_background():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Load dependencies on first use
        load_ml_dependencies()

        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Process image
        input_image = Image.open(file.stream)
        output_image = remove_bg_function(input_image)

        # Save to bytes
        img_io = BytesIO()
        output_image.save(img_io, format='PNG')
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name='removed-bg.png'
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting app on port {port}")
    app.run(host="0.0.0.0", port=port)
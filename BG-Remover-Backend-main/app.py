from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from rembg import remove
from PIL import Image
from io import BytesIO
import os

app = Flask(__name__)

# Simple CORS setup
CORS(app)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

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
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Open and process the image
        input_image = Image.open(file.stream)

        # Remove background
        output_image = remove(input_image)

        # Convert to bytes
        img_io = BytesIO()
        output_image.save(img_io, format='PNG')
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name='removed-bg.png'
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
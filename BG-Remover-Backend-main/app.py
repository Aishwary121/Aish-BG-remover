from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from rembg import remove
from PIL import Image
import base64
from io import BytesIO
import os

app = Flask(__name__)

# Enable CORS
CORS(app,
     origins=["*"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "OPTIONS"],
     supports_credentials=True)

@app.route('/')
def home():
    return "Hello from Aish BG Remover!"

@app.route('/health')
def health():
    return "OK", 200

@app.route('/remove-bg', methods=['POST', 'OPTIONS'])
def remove_background():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Check if the request contains files (FormData)
        if 'image' in request.files:
            # Handle file upload
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400

            # Read image from file
            input_image = Image.open(file.stream)

        elif request.is_json:
            # Handle JSON with base64 image
            data = request.get_json()
            if not data or 'image' not in data:
                return jsonify({'error': 'No image provided'}), 400

            # Decode base64 image
            image_string = data['image']
            if ',' in image_string:
                image_string = image_string.split(',')[1]

            image_data = base64.b64decode(image_string)
            input_image = Image.open(BytesIO(image_data))
        else:
            return jsonify({'error': 'Invalid request format'}), 400

        # Remove background
        output_image = remove(input_image)

        # Convert to PNG bytes
        img_byte_arr = BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        # Return the image as a file
        response = make_response(img_byte_arr.getvalue())
        response.headers.set('Content-Type', 'image/png')
        response.headers.set('Content-Disposition', 'attachment', filename='removed-bg.png')
        return response

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return 'Background Remover API'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
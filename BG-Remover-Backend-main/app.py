from flask import Flask, request, send_file, jsonify, make_response
from flask_cors import CORS
from rembg import remove
from PIL import Image
from io import BytesIO
import os

# Force rembg to use CPU only to save memory
os.environ["RMBG_ORT_EXECUTION_PROVIDER"] = "CPUExecutionProvider"

app = Flask(__name__)

# CORS setup
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

# Limit maximum image dimensions to save memory
MAX_WIDTH = 1024
MAX_HEIGHT = 1024

@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    return "Hello from Aish BG Remover!"

@app.route('/remove-bg', methods=['POST', 'OPTIONS'])
def remove_background():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Open and resize image to fit memory limit
        input_image = Image.open(file.stream)
        input_image.thumbnail((MAX_WIDTH, MAX_HEIGHT))

        # Remove background
        output_image = remove(input_image)

        # Convert to bytes
        img_io = BytesIO()
        output_image.save(img_io, format='PNG')
        img_io.seek(0)

        # Clean up large objects
        input_image.close()
        output_image.close()

        response = make_response(send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name='removed-bg.png'
        ))
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

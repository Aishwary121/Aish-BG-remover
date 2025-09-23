from flask import Flask, request, send_file, jsonify, make_response
from flask_cors import CORS
from rembg import remove
from PIL import Image
from io import BytesIO
import os

app = Flask(__name__)

# Configure CORS before any routes
app.config['CORS_HEADERS'] = 'Content-Type'

# Apply CORS with explicit settings
CORS(app,
     resources={r"/*": {
         "origins": "*",
         "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
         "expose_headers": ["Content-Range", "Accept-Ranges"],
         "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
         "max_age": 3600
     }})

# Add CORS headers to every response
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@app.route('/', methods=['GET', 'OPTIONS'])
def home():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    return "Hello from Aish BG Remover!"

@app.route('/test', methods=['POST', 'OPTIONS'])
def test():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    return jsonify({"message": "CORS is working!"}), 200

@app.route('/remove-bg', methods=['POST', 'OPTIONS'])
def remove_background():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    try:
        # Log the request
        print(f"Received request from origin: {request.headers.get('Origin')}")

        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        print(f"Processing image: {file.filename}")

        # Process image
        input_image = Image.open(file.stream)
        output_image = remove(input_image)

        # Convert to bytes
        img_io = BytesIO()
        output_image.save(img_io, format='PNG')
        img_io.seek(0)

        # Return with explicit CORS headers
        response = make_response(send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name='removed-bg.png'
        ))

        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        print(f"Error processing image: {str(e)}")
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
    print(f"Starting Flask app on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
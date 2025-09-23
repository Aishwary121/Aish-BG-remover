from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
from rembg import remove
from PIL import Image
from io import BytesIO
import os

app = Flask(__name__)

# Configure CORS with explicit settings
CORS(app,
     resources={r"/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True,
     max_age=3600)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@app.route('/')
def home():
    return "Hello from Aish BG Remover!"

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/remove-bg', methods=['POST', 'OPTIONS'])
def remove_background():
    try:
        print(f"Received {request.method} request")
        print(f"Headers: {dict(request.headers)}")

        # Check if image file is in the request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        print(f"Processing file: {file.filename}")

        # Open and process the image
        input_image = Image.open(file.stream).convert('RGBA')

        # Remove background
        output_image = remove(input_image)

        # Convert to bytes
        img_io = BytesIO()
        output_image.save(img_io, format='PNG', optimize=True)
        img_io.seek(0)

        # Return the processed image with proper headers
        response = send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name='removed-bg.png'
        )

        # Add CORS headers to the file response
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting app on port {port}")
    app.run(host="0.0.0.0", port=port)
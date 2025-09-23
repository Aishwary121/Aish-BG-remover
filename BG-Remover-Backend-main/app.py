from flask import Flask, request, send_file
from flask_cors import CORS
import os
import tempfile

app = Flask(__name__)
CORS(app)  # Allow all origins

# Lazy load heavy imports
rembg = None

def load_dependencies():
    global rembg
    if rembg is None:
        from rembg import remove
        rembg = remove

@app.route('/health')
def health():
    return "OK", 200

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    load_dependencies()  # Load heavy imports only when needed

    if 'image' not in request.files:
        return {'error': 'No image uploaded'}, 400

    file = request.files['image']
    if file.filename == '':
        return {'error': 'No image selected'}, 400

    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_input:
        file.save(temp_input.name)
        input_path = temp_input.name

    # Process
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_output:
        output_path = temp_output.name

    try:
        with open(input_path, 'rb') as i:
            input_image = i.read()

        output = remove(input_image)

        with open(output_path, 'wb') as o:
            o.write(output)

        # Send file
        return send_file(output_path, mimetype='image/png', as_attachment=True, download_name='no-bg.png')
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        # Cleanup
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

@app.route('/')
def home():
    return 'Background Remover API'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
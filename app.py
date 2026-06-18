import re
import base64
import binascii
import threading
from io import BytesIO

import cv2
import numpy as np
from flask import Flask, request, render_template, jsonify
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)

# Load the model and labels once at startup rather than on every request.
LABEL_NAMES = sorted(
    ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog',
     'frog', 'horse', 'ship', 'truck']
)
NET = cv2.dnn.readNetFromONNX('cifar_classifier.onnx')

# cv2.dnn.Net is not thread-safe; serialize inference across worker threads.
NET_LOCK = threading.Lock()


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    # --- Parse and validate client input (client errors -> 400) ---
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, str):
            return jsonify(error='Expected a base64 image string.'), 400

        image_data = re.sub('^data:image/.+;base64,', '', payload)
        raw = base64.b64decode(image_data)
        pil_image = Image.open(BytesIO(raw)).convert('RGB')
    except (binascii.Error, ValueError, UnidentifiedImageError):
        return jsonify(error='Invalid or unreadable image data.'), 400

    # --- Run inference (server errors -> 500) ---
    try:
        img = cv2.resize(np.array(pil_image), (32, 32))
        img = np.array([img]).astype('float64') / 255.0

        with NET_LOCK:
            NET.setInput(img)
            out = NET.forward()

        index = int(np.argmax(out[0]))
        label = LABEL_NAMES[index].capitalize()
        return jsonify(result=label)
    except Exception:
        app.logger.exception('Inference failed')
        return jsonify(error='Could not classify the image.'), 500

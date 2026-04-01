from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import os
from PyPDF2 import PdfReader

app = Flask(__name__)
CORS(app)

# Configuration
API_KEY = "AIzaSyAE8kUxY-UP4j-wYbg7bhcP-wZKG3TJ6II"
MODEL_NAME = "gemini-1.5-flash"

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL_NAME)

# Simple global context for RAG
pdf_context = {
    "text": "",
    "filename": ""
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def css():
    return send_from_directory('.', 'style.css')

@app.route('/main.js')
def js():
    return send_from_directory('.', 'main.js')

@app.route('/upload', methods=['POST'])
def upload():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and file.filename.endswith('.pdf'):
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            pdf_context["text"] = text
            pdf_context["filename"] = file.filename
            
            return jsonify({
                "status": "success",
                "filename": file.filename,
                "message": f"Parsed {len(reader.pages)} pages."
            })
        else:
            return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        userInput = data.get('prompt', '')
        
        if not userInput:
            return jsonify({"error": "No prompt provided"}), 400
            
        print(f"Generating content for prompt: {userInput}")
        
        # Augment prompt if PDF context is active
        final_prompt = userInput
        if pdf_context["text"]:
            final_prompt = f"""
            You are a helpful assistant grounding your answers in the following document: {pdf_context['filename']}
            
            EXTRACTED DOCUMENT CONTEXT:
            ---
            {pdf_context['text'][:10000]}  # Limiting to 10k chars for simple RAG context
            ---
            
            USER QUESTION: {userInput}
            
            Instructions: Use the provided document context to answer the user's question. If the information is not in the document, state that you are answering from your general knowledge but note the document didn't specify.
            """

        response = model.generate_content(final_prompt)
        
        return jsonify({
            "response": response.text,
            "status": "success"
        })
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

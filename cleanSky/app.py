from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Home route
@app.route('/')
def home():
    return render_template('index.html')  # This will be your frontend page

# API route (backend endpoint)
@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json  # Receive JSON data from frontend
    # Do backend stuff here (or call another Python backend service)
    result = {"message": f"Received {data}"}
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
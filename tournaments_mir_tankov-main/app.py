import os

from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tournaments')
def get_tournaments():
    url = 'https://challenge.tanki.su/api/v1/tournaments/get-active'
    response = requests.get(url)
    data = response.json()
    return jsonify(data)


@app.route('/api/tournament/<int:tournament_id>')
def get_tournament_results(tournament_id):
    offset = request.args.get( 'offset', 0 )
    limit = request.args.get( 'limit', 40 )
    url = f'https://challenge.tanki.su/api/v1/tournaments/{tournament_id}?offset={offset}&limit={limit}&lang=ru&column=rating'
    response = requests.get( url )
    data = response.json()
    return jsonify( data )

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

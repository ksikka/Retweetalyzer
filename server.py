from flask import Flask, render_template, json
app = Flask(__name__)

import getdata

@app.route('/')
def main():
    return render_template('index.html')

@app.route('/<username>/data.json')
def userdata(username):
    if username.startswith('@'):
        username = username[1:]

    if username == '':
        return 'Blank Username', 400

    data = getdata.get_user_timeline(username)['tweets']

    return json.dumps(data)

@app.route('/<username>/retweet_data.json')
def retweetdata(username):
    if username.startswith('@'):
        username = username[1:]

    if username == '':
        return 'Blank Username', 400

    tweets = getdata.get_user_timeline(username)['tweets']
    data = getdata.get_retweet_data(tweets)

    return json.dumps(data)

@app.route('/static/<path:path>')
def static_proxy(path):
    # send_static_file will guess the correct MIME type
    return app.send_static_file('static/'+path)

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask
from flask import request
from flask import make_response, Response, send_file
from io import BytesIO
import requests

app = Flask(__name__)
PORT = 8888

#EPSG:3301
# https://fotoladu.maaamet.ee/data/tms/of_live/13/4084/4773
URL = "https://fotoladu.maaamet.ee/data/tms/of_live/{}/{}/{}"
tile=0
@app.route("/<z>/<x>/<y>")
def handle_request(z,x,y):
    global tile
    tile=requests.get(URL.format(z,x,y), headers= {'referer':f"https://fotoladu.maaamet.ee/?basemap=kiirortofoto&zlevel={z},24.0,59.0&overlay=uued" })
    response = make_response(tile.content)
    response.headers.set('Content-Type', 'image/jpeg')
    return response

print("This is flask app serving tiles for the url.\n\
Please minimize this window and continue to GUI")
if __name__ == '__main__':
    app.run(debug=False, host="127.0.0.1", port=PORT)

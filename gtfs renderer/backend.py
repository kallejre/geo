from flask import Flask
from flask import request
from flask import send_file
import config
app = Flask(__name__)
last_t=0
layers=[]
folder_selected=None
@app.route("/<z>/<x>/<y>")
def hello(z,x,y):
    global last_t
    t=request.args.get('t')  # Timestamp
    if t != last_t:
        load_config()
        last_t=t
    # print("Requested:",z,x,y, t)
    return send_file("sample.png", mimetype='image/gif')


def load_config():
    global layers
    global folder_selected
    with open("layers.txt") as f:
        layers=f.readlines()
        folder_selected=' '.join(layers.pop(0).split()[1:])


print("This is flask app serving tiles for the url.\n\
Please minimize this window and continue to GUI")
if __name__ == '__main__':
    app.run(debug=False, host=config.interface, port=config.port)

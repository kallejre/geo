from flask import Flask
from flask import request
from flask import send_file, make_response
from io import BytesIO
from PIL import Image, ImageDraw
import config
import gtfs
app = Flask(__name__)
last_t=0
layers=[]
folder_selected=None
folder_old = None
selected_shapes = []
@app.route("/<z>/<x>/<y>")
def handle_request(z,x,y):
    global last_t
    t=request.args.get('t')  # Timestamp
    if t != last_t:
        load_config()
        last_t=t
    # print("Requested:",z,x,y, t)
    img=draw_img(z,x,y)
    return serve_pil_image(img)


def load_config():
    global layers
    global folder_selected, folder_old
    global selected_shapes
    with open("layers.txt") as f:
        layers=f.read().strip().split('\n')
        folder_selected=' '.join(layers.pop(0).split()[1:])
    if folder_old != folder_selected:
        folder_old = folder_selected
        gtfs.init(folder_selected)
    selected_shapes = []
    for ui_name in layers:
        shps = gtfs.get_route_by_short(ui_name).shapes
        for shape_id in shps:
            selected_shapes.append(shps[shape_id].coordlist)
def draw_img(z,x,y):
    with Image.new(mode="RGBA", size=(256, 256)) as im:
        draw = ImageDraw.Draw(im)
        draw.line((0, 0) + im.size, fill=(255,0,0,200), width=4)
        draw.line((0, im.size[1], im.size[0], 0), fill=(255,0,0,100), width=4)
        # TODO: Add actual GTFS rendering
    return im

def serve_pil_image(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'png')
    img_io.seek(0)
    response = make_response(send_file(img_io, mimetype='image/png'))
    response.cache_control.max_age = 15  # 15 sec
    response.cache_control.public = True
    return response


print("This is flask app serving tiles for the url.\n\
Please minimize this window and continue to GUI")
if __name__ == '__main__':
    load_config()
    app.run(debug=False, host=config.interface, port=config.port)

from flask import Flask
from flask import request
from flask import send_file, make_response
from io import BytesIO
from PIL import Image, ImageDraw
import random, math
import config
import gtfs
from colorsys import hls_to_rgb
import argparse
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

cache_zoom = 20  # Relatively high zoom level, that is used for storing X/Y tile location in memory.
def load_config():
    print("(Re)-loading config")
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
        rt = gtfs.get_route_by_short(ui_name)
        shps = rt.shapes
        selected_shapes.append({"name":rt.ref, "shp":list()})
        selected_shapes[-1]["colour"] = get_col()
        for shape_id in shps:
            shp = list(map(lambda x:deg2tile_float(x[0], x[1], cache_zoom),shps[shape_id].coordlist))
            selected_shapes[-1]["shp"].append(shp)
def deg2tile_float(lat_deg: float, lon_deg: float, zoom: int):
    lat_rad = math.radians(lat_deg)
    n = 2 ** zoom
    xtile = (lon_deg + 180.0) / 360 * n
    # Sets safety bounds on vertical tile range.
    if lat_deg >= 89:
        return (xtile, 0)
    if lat_deg <= -89:
        return (xtile, n - 1)
    ytile = (1 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2 * n
    limited_ytile = max(min(n, ytile), 0)
    return (xtile, limited_ytile)
def get_col():
    c=hls_to_rgb(random.random(), 0.4+0.2*random.random(), 0.9+0.1*random.random())
    return tuple(map(lambda x:int(x*256),c))
    return random.choice(["#ff0000", "#ff00ff", "#ffff00", "#00ff00", "#00ffff", "#0000ff"])
def draw_img(z,x,y):
    z,x,y=int(z), int(x), int(y)
    multiplier = 2 ** (z-cache_zoom )
    print(multiplier)
    with Image.new(mode="RGBA", size=(256, 256)) as im:
        draw = ImageDraw.Draw(im)
        #draw.line((0, 0) + im.size, fill=(255,0,0,200), width=4)
        #draw.line((0, im.size[1], im.size[0], 0), fill=(255,0,0,100), width=4)
        # TODO: Move parts of this to data loading.
        for line in selected_shapes:
            ref = line["name"]
            for shp in line["shp"]:  # List of lat/lon-s
                shp = list(map(lambda tile: ((multiplier*tile[0]-x)*256, (multiplier*tile[1]-y)*256),shp))
                draw.line(shp, width=7, fill=line["colour"], joint="curve")
    return im

def serve_pil_image(pil_img):
    img_io = BytesIO()
    pil_img.save(img_io, 'png')
    img_io.seek(0)
    response = make_response(send_file(img_io, mimetype='image/png'))
    response.cache_control.max_age = 15  # 15 sec
    response.cache_control.public = True
    return response


# TODO: Fix load balancers having different colour schemas

ConnectionInfo = argparse.ArgumentParser(description='Get port number')
ConnectionInfo.add_argument("-port", type=int, default=config.port)
ConnectionInfoParsed = ConnectionInfo.parse_args()

print("This is flask app serving tiles for the url.\n\
Please minimize this window and continue to GUI")
if __name__ == '__main__':
    load_config()
    app.run(debug=False, host=config.interface, port=ConnectionInfoParsed.port)

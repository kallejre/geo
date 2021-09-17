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
show_stops=None
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
    global selected_shapes, show_stops
    with open("layers.txt") as f:
        layers=f.read().strip().split('\n')
        first_line = layers.pop(0)
        show_stops = first_line.split()[1]=="True"
        folder_selected=' '.join(first_line.split()[2:])
    if folder_old != folder_selected:
        folder_old = folder_selected
        print(folder_selected)
        gtfs.init(folder_selected)
    selected_shapes = []
    for ui_name in layers:
        rt = gtfs.get_route_by_short(ui_name)
        shps = rt.shapes
        selected_shapes.append({"name":rt.ref, "shp":list()})
        selected_shapes[-1]["colour"] = get_col(rt.name)
        for shape_id in shps:
            shp = list(map(lambda x:gtfs.deg2tile_float(x[0], x[1], cache_zoom),shps[shape_id].coordlist))
            selected_shapes[-1]["shp"].append(shp)

def get_col(val=None):
    random.seed(val)
    c=hls_to_rgb(random.random(), 0.4+0.2*random.random(), 0.9+0.1*random.random())
    return tuple(map(lambda x:int(x*256),c))
    return random.choice(["#ff0000", "#ff00ff", "#ffff00", "#00ff00", "#00ffff", "#0000ff"])
def draw_img(z,x,y):
    z,x,y=int(z), int(x), int(y)
    # Multiplier: Link between scaling of current level and lvl 20.
    multiplier = 2 ** (z-cache_zoom )
    print(multiplier)
    with Image.new(mode="RGBA", size=(256, 256)) as im:
        draw = ImageDraw.Draw(im)
        #draw.line((0, 0) + im.size, fill=(255,0,0,200), width=4)
        #draw.line((0, im.size[1], im.size[0], 0), fill=(255,0,0,100), width=4)
        # TODO: Add checkboxes for transparency and stops.
        # TODO: Presistent colours
        for line in selected_shapes:
            ref = line["name"]
            for shp in line["shp"]:  # List of lat/lon-s
                shp = list(map(lambda tile: ((multiplier*tile[0]-x)*256, (multiplier*tile[1]-y)*256),shp))
                draw.line(shp, width=7, fill=line["colour"], joint="curve")
        if show_stops and z>10:
            max_stops=256
            drawn_stops=0
            #print(x,y, multiplier)
            for x20 in range(int(x/multiplier)-1, int((x+1)/multiplier)+1):
                for y20 in range(int(y/multiplier)-1, int((y+1)/multiplier)+1):
                    # print((x,y), (x,y) in gtfs.stop_idx)
                    if max_stops < drawn_stops: break
                    if (x20,y20) in gtfs.stop_idx:
                        for stop_id in gtfs.stop_idx[(x20,y20)]:
                            tile=list(map(lambda x:int(256*(x%1)), gtfs.deg2tile_float(gtfs.stops[stop_id].lat,gtfs.stops[stop_id].lon,z)))
                            #print("Drawing to", (tile[0], tile[1], tile[0]+5, tile[1]+5))
                            draw.rectangle((tile[0], tile[1], tile[0]+5, tile[1]+5), fill=(256,200,0,min([256,max([0,64*(z-10)])])))
                            drawn_stops+=1
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

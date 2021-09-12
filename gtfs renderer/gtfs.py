import os
folder=None
stops= dict()  # Dictionary of stops, referenced by stop_id
stop_idx = dict()  # Dictionary of stops, spatially indexed in after 2 deciamal places
route_type = dict()  # https://developers.google.com/transit/gtfs/reference/extended-route-types
routes=dict()
def init(path):
    global folder
    folder=path
    load_route_types()
    load_stops(os.path.join(folder, "stops.txt"))
    load_routes(os.path.join(folder, "routes.txt"))
    
    
def load_gtfs_from_folder(scrollbox):
    os.listdir(folder)
    scrollbox.insert('Walnuts')


def load_stops(filepath):
    with open(filepath, encoding="utf8") as f:
        header=list(map(lambda x:x.strip("\ufeff").strip(),f.readline()[:-1].split(",")))
        for line in f.readlines():
             stop=Stop(dict(zip(header, list(map(lambda x:x.strip(),line.split(","))))))
             stops[stop.id]=stop
             idx=(int(stop.lat*100)/100, int(stop.lon*100)/100)
             if idx not in stop_idx:
                 stop_idx[idx]=set()
             stop_idx[idx].add(stop.id)

def get_route_names():
    if not folder:
        raise SyntaxError("GTFS folder not set. (Use gtfs.folder=<path> before calling commands")
    
    
def load_routes(filepath):
    global routes
    print("Load routes")
    with open(filepath, encoding="utf8") as f:
        header=list(map(lambda x:x.strip("\ufeff").strip(),f.readline()[:-1].split(",")))
        for line in f.readlines():
             route=Route(dict(zip(header, list(map(lambda x:x.strip(),line.split(","))))))
             routes[route.id]=route
    


def load_route_types():
    global route_type
    with open("service_types.txt") as f:
        f.readline()  # Header
        lines=f.readlines()
        print(lines[2])
        route_type=dict(list(map(lambda x:(int(x.split(",")[0]),x.split(",")[1].strip()), lines)))

class Stop():
    def __init__(self,csv_row):
        # Input type: dict {column_header: value}
        self.id = csv_row["stop_id"]
        self.ref = csv_row["stop_code"].strip('"')
        self.name = csv_row["stop_name"].strip('"')
        self.lat = float(csv_row["stop_lat"])
        self.lon = float(csv_row["stop_lon"])
        self.pos = (self.lat, self.lon)

class Route():
    def __init__(self,csv_row):
        # Input type: dict {column_header: value}
        self.id = csv_row["route_id"]
        self.ref = csv_row["route_short_name"].strip('"')
        self.name = csv_row["route_long_name"].strip('"')
        self.type = route_type[int(csv_row["route_type"])]


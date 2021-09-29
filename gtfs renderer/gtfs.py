import os
import math
folder=None
stops= dict()  # Dictionary of stops, referenced by stop_id
stop_idx = dict()  # Dictionary of stops, spatially indexed in after 2 deciamal places
route_type = dict()  # https://developers.google.com/transit/gtfs/reference/extended-route-types
rt_names = dict()  # Special short name used in UI
shp_to_rt = dict()  # Indexing for shape id to route id.
routes=dict()
def init(path):
    global folder
    folder=path
    load_route_types()
    load_stops(os.path.join(folder, "stops.txt"))
    load_routes(os.path.join(folder, "routes.txt"))
    load_shapes()
    
    
def populate_route_list(scrollbox):
    for route in get_route_names():
        scrollbox.insert(route)

def get_route_by_short(short_name):
    return routes[rt_names[short_name]]

def csv_to_dict(path):
    with open(path, encoding="utf8") as f:
        header=list(map(lambda x:x.strip("\ufeff").strip(),f.readline().strip('\n').split(",")))
        for line in f.readlines():
             yield dict(zip(header, list(map(lambda x:x.strip(),line.split(",")))))
    

def load_stops(filepath):
    for stp in csv_to_dict(filepath):
        stop=Stop(stp)
        stops[stop.id]=stop
        # Stops are spatially indexed to speed up lookup.
        
        idx=tuple(map(int,deg2tile_float(stop.lat,stop.lon,20)))
        if idx not in stop_idx:
            stop_idx[idx]=set()
        stop_idx[idx].add(stop.id)

def get_route_names():
    if not folder:
        raise SyntaxError("GTFS folder not set. (Use gtfs.folder=<path> before calling commands")
    out=[]
    for rt_id in routes:
        out.append(routes[rt_id])
    out=list(map(lambda x:x._list_name,sorted(out, key=lambda x: x._sortval)))
    return out
    
def load_routes(filepath):
    global routes
    print("Load routes")
    for rt in csv_to_dict(filepath):
        route=Route(rt)
        routes[route.id]=route
        rt_names[route._list_name]=route.id

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
        self._list_name = self.type.split()[0]+' '+self.ref
        #print(self._list_name,self.id, self.ref)
        #self._sortval = (self.type, self.id.split('_')[1], self.ref.zfill(5))
        self._sortval = (self.type,  self.ref.zfill(5))
        self.shapes = dict()

class Shape():
    def __init__(self,csv_row):
        # Input is dict for csv row from trips.txt
        self.label = csv_row["trip_headsign"]
        self.id = csv_row["shape_id"]
        self.rt_id = csv_row["route_id"]
        self.coords = dict()  # Coordinates has unusual format: key = index; value = (lat, lon)
    @property
    def coordlist(self):
        return list(map(lambda x: self.coords[x], sorted(self.coords)))
        
    def add_coord(self, idx, lat, lon):
        self.coords[int(idx)] = (float(lat), float(lon))
        
def load_shapes():
    # Trips: route_id -> shape_id
    # Shapes: shape_id -> lat-lon
    # Stops: route_id + shape_id -> trip_id  (Stop_times) trip_id -> stop_id -> lat-lon
    for trip in csv_to_dict(os.path.join(folder, "trips.txt")):
        if trip["shape_id"] not in routes[trip["route_id"]].shapes:
            routes[trip["route_id"]].shapes[trip["shape_id"]] = Shape(trip)
            shp_to_rt[trip["shape_id"]] = trip["route_id"]
    for shp in csv_to_dict(os.path.join(folder, "shapes.txt")):
        routes[shp_to_rt[shp["shape_id"]]].shapes[shp["shape_id"]].add_coord(shp["shape_pt_sequence"], shp["shape_pt_lat"],shp["shape_pt_lon"])

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
           
if __name__ == "__main__":
    init('gtfs_tallinn_2021')

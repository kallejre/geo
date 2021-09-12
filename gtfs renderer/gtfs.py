from os import path
folder=None
stops= dict()  # Dictionary of stops, referenced by stop_id
stop_idx = dict()  # Dictionary of stops, spatially indexed in after 2 deciamal places
def init(path):
    global folder
    folder=path
    routes_path=os.path.join(folder, "routes.txt")
    load_stops(os.path.join(folder, "stops.txt"))
    
    
def load_gtfs_from_folder(scrollbox):
    os.listdir(folder_selected)
    scrollbox.insert('Walnuts')


def load_stops(filepath)
    with open(filepath) as f:
        header=list(map(lambda x:x.strip(),f.readline()[:-1].split(",")))
        for line in f.readlines():
             stop=BusStop(dict(zip(header, list(map(lambda x:x.strip(),line.split(","))))))
             stops[stop.id]=stop
             stop_idx[(int(stop.lat*100)/100, int(stop.lon*100)/100)]=stop.id

def get_route_names():
    if not folder:
        raise SyntaxError("GTFS folder not set. (Use gtfs.folder=<path> before calling commands")
    

class BusStop():
    def __init__(self,csv_row):
        # Input type: dict {column_header: value}
        self.id = csv_row["stop_id"]
        self.ref = csv_row["stop_code"]
        self.name = csv_row["stop_name"]
        self.pos = (float(csv_row["stop_lat"]), float(self.id = csv_row["stop_lon"]))


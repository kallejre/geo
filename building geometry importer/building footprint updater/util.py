#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Vajab Python 3.7 või uuem
# Siin failis on funktsioonid, mida skript vajab
import time, datetime, os, overpy, math, osmapi
from urllib.request import urlopen
from urllib.error import HTTPError
from hashlib import sha256
from config import *
chs_open=False
# Konstant, mida kasutatakse kauguste arvutamisel
Lng_Err_correction = None
OsmApi=osmapi.OsmApi(auth['user'],auth['pwd'], api=auth['api_url'])
# OverApi = overpy.Overpass()

last = time.time()
def bench():
    # Ajamõõtmissüsteem jõudluse hindamiseks. Tagastab viimasest funktsiooni väljakutsumisest möödunud aja.
    global last
    temp = time.time()
    x = temp - last
    last = temp
    return round(x, 4)


# Overpassi päring
def overpass_wrapper(search_Area, aastaid=10, exclude_shared_nodes=False, update=False, JSON=True):
    """Haldab päringu koostamist."""
    # Külgnevuskasti koordinaatide märkimise järjekord.
    #  ┌──2──┐
    #  1 BOX 3
    #  └──0──┘
    temp = time.time()
    print('Funktsioon käivitus, ala:', search_Area, bench())
    if type(search_Area) in {list, tuple}:
        bbox = True
    elif type(search_Area) == str:
        bbox = False
        if '/' in search_Area and search_Area.split('/')[0] in {'way', 'relation'}:
            # https://help.openstreetmap.org/questions/46989
            areacode = True
            # Toetatd on alad, millel on nimi. https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#By_area_.28area.29
            search_Area = 'area:' + str(
                int(search_Area.split('/')[1]) + (2400000000 if search_Area.split('/')[0] == 'way' else 3600000000))
        else:
            areacode = False
    else:
        raise ValueError("Tundmatu sisendpiirkonna tüüp")
    QUERY = str(Overpass_mall)
    if bbox:
        QUERY = QUERY.replace('area[name', '// Area[name')
        QUERY = QUERY.replace('area', ','.join.bbox)
    elif areacode:
        QUERY = QUERY.replace('area[name', '// Area[name')
        QUERY = QUERY.replace('area', search_Area)
    else:
        QUERY = QUERY.replace('{{name}}', search_Area)
    if not JSON:
        QUERY = QUERY.replace('json', 'xml')
    # Kuupäeva leidmine. Päringus endas asendatakse kuupäev alles paele räsikontrolli
    t = str(datetime.datetime.now() - datetime.timedelta(round(365.25 * aastaid))).split()
    before_date = t[0] + 'T' + t[1].replace('.', ':') + 'Z'

    # Järgneva muudatuse tegemisel lubatakse päringus hooned, kus mõni sõlm on jagatud muud tüüpi elemendiga, 
    # näiteks majanurgani ehitatud aiaga. Muudatuse tegemiseks kommenteeritakse 2 rida välja.
    # NB kuna Verbatiumi import sisaldas ainult majanurki, siis nt välisuksed on juba välja filtreeritud.
    if not exclude_shared_nodes:
        QUERY = QUERY.replace('\n ;', '\n// ;')
    # Kommentaaride ja reavahetuste eemaldamine. Lihtne lahendus, mis ei kasuta regexit.
    # Selle tegevusega muutub päring umbes kolmveerandi võrra lühemaks
    QUERY = ''.join(list(map(lambda x: x.split('//')[0].strip(), QUERY.split('\n'))))
    # Kuna kuupäev ja kellaaeg muutuvad pidevalt, ei ole vahemälul mõtet kui igal päringul on erinev ajatempel
    # Samas on vaja säilitada päringu vahemälus teave ajavahemikust, mille kohta päring tehti.
    QUERY = QUERY + '//' + str(aastaid)
    print('overpass() kutsumine', bench())
    # print(QUERY)
    result = overpass(QUERY, before_date, update, JSON)
    print('Valmis', round(time.time() - temp, 4))
    return result


# Overpass koos cahcega
def overpass(QUERY, before_date, update=False, JSON=True):
    """Haldab päringu läbiviimist ja vahemälu."""
    max_cache_age = 30
    if JSON:
        ext = '.json'
    else:
        ext = '.xml'
    # Räsifunktsiooni eesmärk on failinimede loomine. MD5 on küll levinum, aga sha256 on tänapäeval õigem.
    hash = sha256(QUERY.encode()).hexdigest()
    print(hash, ext)
    QUERY = QUERY.replace('{{date:3653 day}}', before_date)
    os.makedirs(overpass_dir, exist_ok=True)
    metadata_fname = os.path.join(overpass_dir, hash + '.txt')
    cache_onnestus = False
    # Metaandmete faili kasutatakse nii: 1. real kuupäev, 2. real päring.
    if not update and os.path.isfile(metadata_fname):
        f = open(metadata_fname)
        kuupv = f.readline().strip()  # Kuupäev
        kuupv2 = datetime.datetime(*map(int, kuupv.split('-')))
        f.close()
        # Järgnev rida arvutab välja, mitu päeva tagasi puhverdatud andmeid viimati uuendati
        vanus = (datetime.datetime.now() - kuupv2).days
        print('Vahemälu lugemine, viimane muutmine', kuupv)
    elif update:
        print('Vahemälu kirjutatakse üle', bench())
    else:
        print('Vahemälu', hash[:6] + '... ei leitud', bench())
    if not update and os.path.isfile(metadata_fname) and vanus < max_cache_age:
        try:
            f = open(os.path.join(overpass_dir, hash + ext), 'rb')
            result = f.read()
            f.close()
            cache_onnestus = True
        except TypeError:
            print('Lugemine ebaõnnestus')
    if not cache_onnestus:
        print('Uue päringu tegemine', bench())
        print(QUERY)
        result = online_query(QUERY)
        print('Päringu vastus käes', bench())
        f = open(os.path.join(overpass_dir, hash + ext), 'wb')
        f.write(result)
        f.close()
        f = open(metadata_fname, 'w')
        print(datetime.date.today().isoformat(), file=f)
        print(QUERY, file=f)
        f.close()

    api = overpy.Overpass(read_chunk_size=chunk, url=Overpass_URL)
    if JSON:
        return api.parse_json(result)
    else:
        return api.parse_xml(result)


def get_overpass_bbox(result):
    # Sisend overpy.Result
    min_lat, max_lat, min_lon, max_lon = 90, -90, 180, -180
    for i in result.get_nodes():
        if i.lat > max_lat: max_lat = i.lat
        if i.lat < min_lat: min_lat = i.lat
        if i.lon > max_lon: max_lon = i.lon
        if i.lon < min_lon: min_lon = i.lon
    return float(min_lat), float(min_lon), float(max_lat), float(max_lon)


def online_query(query):
    # OverPy lähtekoodist saadud päringu tegemise kood.
    # Sisuliselt on see väga lihtsustatud veebipäringu tegemine
    if not isinstance(query, bytes):
        query = query.encode("utf-8")
    try:
        f = urlopen(Overpass_URL, query)
    except HTTPError as e:
        f = e
    response = f.read()
    f.close()
    if f.code == 200:
        return response
    if f.code == 400:
        raise overpy.exception.OverpassBadRequest(query, msgs=response)
    if f.code == 429:
        raise overpy.exception.OverpassTooManyRequests
    if f.code == 504:
        raise overpy.exception.OverpassGatewayTimeout
    e = overpy.exception.OverpassUnknownHTTPStatusCode(f.code)
    raise e


def way_bbox(way):
    # Leiab overpassi päringuga saadud hoone külgnevuskasti
    lats = list(map(lambda x: x.lat, way.nodes))
    lons = list(map(lambda x: x.lon, way.nodes))
    # min_lat, min_lon, max_lat, max_lon
    return list(map(float, [min(lats), min(lons), max(lats), max(lons)]))


def shp_id_generator(box, etak_grid):
    # Sisend: L-Est ristkoordinaatidena külgnevuskast (täisarvud)
    # Väljund: SHP-faili elemendi ID-d.
    # Itereerib hoone külgnevuskasti ja 
    # ühe ühiku laiuses puhvris etak hooneid.
    # Grid võtme näide: (6282, 64453)
    # Box näide: [6581864, 536522, 6581875, 536533]
    itms = set()
    for xx in range(int(box[0] // grid_size) - 1, int(box[2] // grid_size) + 2):
        for yy in range(int(box[1] // grid_size) - 1, int(box[3] // grid_size) + 2):
            if (yy, xx) in etak_grid:
                for item in etak_grid[(yy, xx)]:
                    if item not in itms:  # Väldib kordusi
                        yield item
                    itms.add(item)


def bbox_overlap(bbox1, bbox2):
    # https://github.com/HazyResearch/pdftotree/blob/master/pdftotree/utils/bbox_utils.py
    # xmin ymin xmax ymax
    if bbox1[2] < bbox2[0] or bbox2[2] < bbox1[0]:
        return False
    if bbox1[3] < bbox2[1] or bbox2[3] < bbox1[1]:
        return False
    return True


def bbox_cover(bbox1, bbox2, lest2=False):
    # 1 kasutus
    if lest2:
        bbox2 = [*lest_geo(*bbox2[:2]), *lest_geo(*bbox2[2:])]
    bb1 = {'x1': bbox1[1], 'x2': bbox1[3], 'y1': bbox1[0], 'y2': bbox1[2]}
    bb2 = {'x1': bbox2[1], 'x2': bbox2[3], 'y1': bbox2[0], 'y2': bbox2[2]}
    # https://stackoverflow.com/questions/25349178
    # determine the coordinates of the intersection rectangle
    x_left = max(bb1['x1'], bb2['x1'])
    y_top = max(bb1['y1'], bb2['y1'])
    x_right = min(bb1['x2'], bb2['x2'])
    y_bottom = min(bb1['y2'], bb2['y2'])

    # The intersection of two axis-aligned bounding boxes is always an
    # axis-aligned bounding box
    intersection_area = (x_right - x_left) * (y_bottom - y_top)

    # compute the area of both AABBs
    bb1_area = (bb1['x2'] - bb1['x1']) * (bb1['y2'] - bb1['y1'])
    bb2_area = (bb2['x2'] - bb2['x1']) * (bb2['y2'] - bb2['y1'])

    # compute the intersection over union by taking the intersection
    # area and dividing it by the sum of prediction + ground-truth
    # areas - the interesection area
    iou = intersection_area / float(bb1_area + bb2_area - intersection_area)
    return iou


def bbox_dist(bbox1, bbox2):
    # Leiab kahe külgnevuskasti keskkohad ning nende vahemaa (m).
    delta_lat1 = bbox1[2] - bbox1[0]
    delta_lon1 = bbox1[3] - bbox1[1]
    center1 = delta_lat1 / 2 + bbox1[0], delta_lon1 / 2 + bbox1[1]
    delta_lat2 = bbox2[2] - bbox2[0]
    delta_lon2 = bbox2[3] - bbox2[1]
    center2 = delta_lat2 / 2 + bbox2[0], delta_lon2 / 2 + bbox2[1]
    # return center1, center2
    return round(((center1[0] - center2[0]) ** 2 + (center1[1] - center2[1]) ** 2) ** 0.5, 2)


def get_MA_address(record):
    # Leiab SHP-faili elemendist aadressinfo.
    # Sisend: dict
    # Tagastab ka etak-koodi.
    # Tulevikus võiks toetada reaalajas päringuid Maa-ameti aadressandmete andmebaasi.
    return [record['etak_id'], record['ads_lahiaa']]


def get_OSM_address(record):
    # Leiab OSM-elemndi siltidest aadressinfo.
    # Sisend: dict
    # Tagastab ka etak-koodi.
    etak = ''
    housename = ''
    street = ''
    housenumber = ''
    if 'addr:housename' in record:  # Leiti talunimi
        housename = record['addr:housename']
    if 'maaamet:ETAK' in record:  # Leiti Etak-kood
        etak = record['maaamet:ETAK']
    if 'addr:street' in record:  # Leiti tänavanimi
        street = record['addr:street']
    if 'addr:housenumber' in record:  # Leiti majanumber
        housenumber = record['addr:housenumber']
    return [etak, street, housenumber, housename]


def lest_geo(y, x):
    # Allikas: Maa-amet. 
    xx, yy = (10395205.478689903 - x), (y - 500000.0)
    LON = (math.atan(yy / xx) / 0.8541758580887914 + 0.41887902048000003) * 57.2957795130823
    u = 1.5707963268 - (
            2.0 * math.atan((((yy ** 2 + xx ** 2) ** 0.50000000000) / 11473298.0383961) ** 1.1707191095724578))
    LAT = (u + 0.0033565514853524606 * math.sin(2.0 * u) + (6.5718727752991235e-06) * math.sin(4.0 * u) +
           (1.7645643646802425e-08) * math.sin(6.0 * u) + (5.328478549061744e-11) * math.sin(
                8.0 * u)) * 57.2957795130823
    return (round(LAT, 6), round(LON, 6))


def geo_lest(north, east):
    # Allikas: Maa-amet. Funktsiooni on muudetud eesti oludesse optimaalsemaks
    # - vähendatud on trigonomeetriliste funktsioonide väljakutsumiste hulka.
    # Sisend on kraadides
    LAT = math.radians(north)
    LON = math.radians(east)
    ##########
    FII = 0.8541758580870844 * (LON - 0.4188790204786391)
    sL = math.sin(LAT)
    e = 0.08181919104283181
    t = math.sqrt(((1.0 - sL) / (1.0 + sL)) * (math.pow(((1.0 + e * sL) / (1.0 - e * sL)), e)))
    aFF = 11473298.03839424
    n = 0.8541758580870844
    p = (aFF * math.pow(t, n))
    p0 = 4020205.47869768
    FN = 6375000.0
    FE = 500000.0
    n = round(p0 - (p * math.cos(FII)) + FN, 2)
    e = round(p * math.sin(FII) + FE, 2)
    return (n, e)  # X, Y


def shape_in_bbox(shp, bbox):
    # Võiks kontrollida kas hoone asub külgnevuskastis.
    # Kiiremaks tööks kontrollitakse ainult esimest sõlme
    sh = shp.points[0]
    return bbox[0] < sh[1] < bbox[2] and bbox[1] < sh[0] < bbox[3]


def shape_in_bbox(shp, bbox):
    # Eelmise funktsiooni alternatiivne variant.
    # Täpsema tulemuse saamiseks kontrollitakse kaht sõlme:
    # Esimest ja keskmist sõlme (sest koordinaadid lähevad ringiga ümber hoone)
    sh = shp.points[0]
    sh2 = shp.points[len(shp.points) // 2]
    return (bbox[0] < sh[1] < bbox[2] and bbox[1] < sh[0] < bbox[3]) or \
           (bbox[0] < sh2[1] < bbox[2] and bbox[1] < sh2[0] < bbox[3])


def shape_to_grid(shp):
    # Saab sisendina hoonekuju ning tagastab esimesest koordinaadist 
    # arvutatud ruudustiku numbri. (Lihtne allaümardamisega jagamine).
    return [tuple(map(lambda x: int(x // grid_size), shp.points[0]))]


def shape_to_grid(shp):
    # Sama põhimõte, mis shape_in_bbox funktsiooniga.
    # Alternatiiv, kus arvestatakse ka keskmise sõlmega
    mid = len(shp.points) // 2
    return set([tuple(map(lambda x: int(x // grid_size), shp.points[0])),
                tuple(map(lambda x: int(x // grid_size), shp.points[mid]))])


# Minimalistlik OP_QL päring, mis leiab hooned, mis jagavad mingi teise hoonega sõlmi
# [out:json][timeout:5];(way(28087750);>;<;>;);out skel tags;

def basic_dist(coor1, coor2):
    # Lest97 tuge pole vaja
    x1, y1 = coor1
    x2, y2 = coor2
    return (x2 - x1) ** 2 + (y2 * Lng_Err_correction - y1 * Lng_Err_correction) ** 2


def edit_start(com=u'Maa-amet building geometry import #MA-geom-21-05', source='Maa-amet 2021'):
    global chs_open
    if not chs_open:
        changes = OsmApi.ChangesetCreate({u"comment": com, u"source": source, u"import": u"yes"})
        chs_open = True


def edit_end(nodelay=False):
    global chs_open
    if chs_open:
        chs_open = False
        OsmApi.ChangesetClose()
        # Wait until end of current minute
        if not nodelay:
            delay = round(max(5,58-time.time() % 60),1)
            print("Changeset closure delay", delay)
            time.sleep(delay)


def update_geometry(sf, osm_id, shp_id, changes=0):
    # Testimiseks: way 26887976 shp 686363
    # update_geometry(26887976, 686363)
    shp = sf.record(shp_id)
    geom = list(map(lambda x: lest_geo(*x), sf.shape(shp_id).points))[:-1]
    osm2shp_node = dict()
    kasutatud_shp = set()
    fails = set()
    now = datetime.datetime.now()
    # Eesmärk leida hooned, mis jagavad külge mõne teisega.
    # Idee oli teha päring avalikku overpassi serverisse et leida naaberhooneid, aga see oli liiga aeglane.
    # Uus lähenemine on allpool, mis kasutab OsmApi.NodeWays funktsiooni.
    # res=OverApi.query(f'[out:json][timeout:15];(way(id:{osm_id});>;<;);out skel;')
    # Juhul kui muudatuse tegemine ületaks OSMi maksimaalset muudatuste hulka,
    # Tagastatakse veateade, et eelmine muudatuskogum tuleks enne kinni panna.
    if len(geom) + 1 + changes >= MAX_CHANGESET_EDITS:
        return len(geom) + 1, ('LIMIT', 'Muudatuste arv ületaks muudatuskogumi limiiidi.')
    # OsmApist päringu tegemine on aeglasem, aga vajalik, sest sealt saab kohaliku versiooninumbri.
    waydi = OsmApi.WayFull(osm_id)  # Way koos kõigi sõlmedega
    for i in waydi:
        if i['type'] == 'node':
            if i['data']['tag']:
                fails.add(('FAIL', 'Sõlmel on atribuudid.', i['data']['id']))
            # Algul prooviti sõlmede kontrollimist overpassiga, aga see tekitas probleeme liiga tihedate päringutega.
            ways_through_node = OsmApi.NodeWays(i['data']['id'])
            if len(ways_through_node) != 1:
                fails.add(
                    ('FAIL', 'Hoone sõlm on jagatud teise hoonega.', tuple(map(lambda x: x['id'], ways_through_node))))
        if (now - i['data']['timestamp']).days < 1:
            fails.add(('FAIL', 'Hiljuti muudetud element.', i['data']['id']))
    if len(waydi) - 1 > len(geom):
        fails.add(('FAIL', 'OSMis olev hoonekuju on detailsem kui Maa-ameti kontuur.'))
    if fails: return 0, ('FAIL', fails)
    way2 = None
    for i in waydi:
        if i['type'] == 'node':
            # Järgmiseks leida lähim SHP sõlm, mida ei ole veel kasutatud.
            # Järgnevad arvutused toimuvad geograafilistes koordinaatides (kraadid). 
            lahim = min(geom, key=lambda node: basic_dist(node, (i['data']['lat'], i['data']['lon'])) + bool(
                node in kasutatud_shp))
            kasutatud_shp.add(lahim)
            osm2shp_node[lahim] = (i['data']['id'], i['data'])
        else:
            way2 = i['data']

    # Sõlmede asendite uuendamine
    # + Sõlmede loendi koostamine koos uutega.
    osm_node_list = []
    news = 0
    muudetud_sõlmi = 0
    for i in geom:
        try:
            if i in osm2shp_node:
                # Sõlme asukohta uuendatakse ainult siis, koordinaate tuleb tõesti liigutada.
                if (osm2shp_node[i][1]['lat'], osm2shp_node[i][1]['lon']) != i:
                    OsmApi.NodeUpdate({'id': osm2shp_node[i][0], 'lat': i[0], 'lon': i[1],
                                       'tag': osm2shp_node[i][1]['tag'], 'version': osm2shp_node[i][1]['version']})
                    muudetud_sõlmi += 1
                osm_node_list.append(osm2shp_node[i][0])  # Sõlme ID listakse joonele.
            else:
                news += 1
                # print('New')
                nod = OsmApi.NodeCreate({'lat': i[0], 'lon': i[1], 'tag': {}})
                osm_node_list.append(nod['id'])
                muudetud_sõlmi += 1
        except osmapi.OsmApiError as error:
            # Paaril korral tekkis segane olukord, kus sõlme ei olnud võimalik uuendada, sest versioonid ei klappinud.
            fails.add(('FAIL', error))
    # Kuna hoonekuju on suletud murdjoon, peab selle esimene ja viimane sõlm olema sama.
    osm_node_list.append(osm_node_list[0])
    # Siltide uuendamine
    tags = way2['tag']
    tags['maaamet:ETAK'] = str(shp.etak_id)
    if shp.korgus_m and muudetud_sõlmi > 0 and shp.korgus_m > 2:
        # Kõrguse lisamine, kui hoonel veel ei ole
        if 'height' not in tags and 'building:height' not in tags:
            tags['height'] = str(shp.korgus_m)
        if 'height' not in tags and 'building:height' in tags:
            # Hetkel loetakse korrektseks kõrgusinfo sildiks height
            tags['height'] = tags['building:height']
            del tags['building:height']
    if muudetud_sõlmi > 0 and 'created_by' in tags:
        # created_by silti loetakse tänapäeval halvaks praktikaks
        # Sildi eemaldamine on lubatud. Harjumaa hoonetel on 60 esinemist.
        # https://wiki.openstreetmap.org/wiki/Key:created_by#Guidance_to_software_developers
        del tags['created_by']
    if 'CityIdx' in tags and tags['CityIdx'] == '213':
        # CityIdx on samuti kahtlane Verbatiumi ajastu silt, ~46 kasutust Väike-Õismäel.
        del tags['CityIdx']
        tags['addr:city'] = 'Tallinn'
    # Eemalda nimi, kui see dubleerib aadressi
    if 'name' in tags and tags['name']:
        if 'addr:housenumber' in tags and tags['addr:housenumber']:
            if tags['name'] == tags['addr:housenumber']:
                del tags['name']
        elif 'addr:housename' in tags and tags['addr:housename']:
            if tags['name'] == tags['addr:housename']:
                del tags['name']
    # tags['source:geometry']='Maa-amet'  # Allika silt peaks minema muudatuskogumile
    # print({'id': osm_id, 'nd': osm_node_list,'version': way2['version'], 'tag': tags})
    OsmApi.WayUpdate({'id': osm_id, 'nd': osm_node_list, 'version': way2['version'], 'tag': tags})
    # print('Joon',osm_id,'-',len(osm_node_list)-1, 'sõlme,',news,'uut.')

    # print(osm_id, len(osm_node_list)-1,news,round(news/(len(osm_node_list)-1-news),2), sep='\t')
    # Täiendav logi selle kohta, kuidas on sõlmede arv muutunud.
    node_stats = list(
        map(str, [osm_id, len(osm_node_list) - 1, news, round(news / (len(osm_node_list) - 1 - news), 2)]))
    time.sleep(building_edit_delay)
    if not fails:
        # +1 muudetud_sõlmede taga tähistab hoonet ennast (way)
        return muudetud_sõlmi + 1, ('SUCCESS', 'Hoone uuendatud.', osm_id, node_stats)
    else:
        return muudetud_sõlmi + 1, ('PARTIAL', fails)

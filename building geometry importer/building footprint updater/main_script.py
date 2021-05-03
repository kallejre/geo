#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Vajab python 3.7 või uuem
import overpy, os, math, osmapi
import progressbar_gui as info
import util
from hashlib import sha256
import shapefile, csv
from config import *

# Download
######################################################################################
print('Overpass', util.bench())

# Avab graafilise edenemisriba ja seadistab selle
inf = info.info()
inf.reset(0, 'Üldine edenemine', 7)
inf.update(0, 1, 'Overpass')
inf.reset(2, 'Viimast edenemisriba hetkel ei kasutata', 1)
inf.update(2, 1)
result = util.overpass_wrapper(otsinguala, aastaid, exclude_shared_nodes, update=False, JSON=True)
# Külgnevuskasti leidmine päringu tulemuse põhjal. Kasti on vaja SHP-st elementide otsimisel.
BOX = util.get_overpass_bbox(result)
# Konstant, mida kasutatakse kauguste arvutamisel
Lng_Err_correction = round(1 / math.cos(math.radians((BOX[1] + BOX[3]) / 2)), 3)
util.Lng_Err_correction = Lng_Err_correction
BOX_Lest = util.geo_lest(BOX[0], BOX[1]) + util.geo_lest(BOX[2], BOX[3])
settings = shp_fname + ' ' + str(BOX) + ' ' + str(buffer_n) + 'x' + str(grid_size)
setting_hash = sha256(settings.encode()).hexdigest()
etak_cache_fname = cache_dir + '/etak_cache_' + setting_hash + '.txt'
overlap_cache_fname = cache_dir + '/overlap_cache_' + setting_hash + '.txt'
overlap_csv_fname = cache_dir + '/overlap_' + setting_hash + '.csv'
upload_log_fname = cache_dir + '/upload_log_' + setting_hash + '.txt'
node_log_fname = cache_dir + '/node_log_' + setting_hash + '.txt'

# Tags, kui ei ole vaja geomeetriat  [https://dev.overpass-api.de/overpass-doc/en/targets/formats.html]
# Geokodeerimisega näide:
# [Allikas: https://dev.overpass-api.de/overpass-doc/en/full_data/area.html]
# Testimiste jaoks on server api06.dev.openstreetmap.org/
# https://protomaps.com/extracts - kiiremini uuenev kui geofabric.

# Hoonete punktid ilma joonteta:
# ( way ["building"] ({{bbox}}); ); (._>;); out meta;
# See päring, mida on vaja, kõik jooned, mis lõikuvad mõne hoonega.
# ( way ["building"] ({{bbox}}); ); (._>;<;>;); out meta;

# Praeguseks reaks on api päring tehtud ning saadud vastu OverPy objekt.
######################################################################################

changes = set()
hooned = dict()
nodes = dict()

print('Overpass laetud, shp avamine', util.bench())
##  Osa 2.
inf.update(0, 1, 'SHP-faili töötlemine')
inf.reset(1, 'SHP avamine', 2)
sf = shapefile.Reader(shp_fname, encoding=shp_encoding)
print('shp-fail avatud', util.bench())
inf.update(1, 1, 'SHP andmete laadimine')
sf.dbf.read()
print('Andmed laetud', util.bench())
# sf.shape(4) ~~ df.records[4] ~~ sf.record(4)
print('Fail avatud', util.bench())

# SHP-failist otsitakse külgnevuskasti mahtuvad hooned.
inf.update(1, 1, 'SHP külgnevuskasti arvutused')
etak_count = 0
inf.update(0, 1, 'Hoonekujude otsimine')
etak_grid = dict()  # ruudustik shp-faili hoonekujudele.
if os.path.isfile(etak_cache_fname):
    f = open(etak_cache_fname, 'r')
    # Esimene rida on seaded, mis on peamiselt mõeldud kasutajale,
    # aga lisaks on seal leitud hoonete koguarv.
    etak_count = int(f.readline().split()[0])
    etak_grid = eval(f.readline())
    f.close()
    print('Hooned laetud vahemälust')
else:  # Ajakulu paar minutit
    inf.reset(1, '', len(sf), True)  # Edenemisriba lähtestamine
    step = 50
    # BOX = min_lat, min_lon, max_lat, max_lon
    BOX_buffer = (BOX_Lest[0] - buffer_n * grid_size, BOX_Lest[1] - buffer_n * grid_size,
                  BOX_Lest[2] + buffer_n * grid_size, BOX_Lest[3] + buffer_n * grid_size)
    # Otsingukasti ümber lisatakse vaikeseadetes 500m laiune puhvertsoon, millest maju otsitakse
    for i in range(len(sf)):  # Vaata läbi iga hoone.
        if i % step == 0:  # Iga X. hoonega uuendatakse edenemisriba. Iga hoonega uuendamine vs ...
            inf.update(1, step)  # ...iga 50. hoonega uuendamine andis umbes 5x ajasäästu.
        shape = sf.shape(i)  # SHP-failist saadud hoonekuju.
        if util.shape_in_bbox(shape, BOX_buffer):
            etak_count += 1
            for grid in util.shape_to_grid(shape):
                # Tsüklit korratakse 1 või 2 korda.
                if grid not in etak_grid:
                    etak_grid[grid] = set()
                etak_grid[grid].add(i)
    # Salvestatakse faili, et järgmine kord taaskasutada.
    f = open(etak_cache_fname, 'w')
    print(etak_count, settings, file=f)
    print(str(etak_grid), file=f)
    f.close()
print(f'Otsingukastist leiti {etak_count} hoonet')
# sf.shape(4) ~~ df.records[4] ~~ sf.record(4)
# Nüüd on leitud kõik ETAK-hooned, mis asuvad samas piirkonnas, kus otsitud hooned.


# Järgmine samm: kattuvate hoonete leidmine.
# Käiakse läbi iga overpassiga leitud hoone ja üritatakse leida vastav hoone Maa-ameti andmekogust.
cleared_count=0
tulemusi=len(result.ways)
inf.update(0,1,'Kattuvate hoonete leidmine')
# Leia kerimisriba uuendamise samm. Pikem samm tähendab kehvemat ülevaadet skripti tööst,
# Väiksem samm muudab tsükli töö aeglasemaks.
bar_update_step = min(20, max(1, len(result.ways) // 60))
if os.path.isfile(overlap_cache_fname):
    f = open(overlap_cache_fname, 'r', encoding='utf8')
    overlapping = eval(f.readline())
    print('Overlap CACHE ENABLED')
else:  # Ajakulu kuni 1 tund
    overlapping = dict()
    inf.reset(1, '', tulemusi, True)
    for i in range(tulemusi):  # Käiakse läbi iga overpassi päringu tulemus.
        if i % bar_update_step == 0:  # Edenemisriba uuendamine
            inf.update(1, bar_update_step)
        OSM_adr = util.get_OSM_address(result.ways[i].tags)
        way_id = result.ways[i].id
        # Uus struktuur: ainult tabelina
        # Kui algne bbox LESTi ümber konverteerida, saab umbes 25% ajavõidu.
        bbox1 = util.way_bbox(result.ways[i])
        # Täisarvudega saab tulemust veidi kiiremaks
        bbox1 = list(map(int, [*util.geo_lest(*bbox1[:2]), *util.geo_lest(*bbox1[2:])]))
        # Selleks et serverisse laetavad muudatused oleksid paremini hoomatavad, 
        # jagatakse üleslaetavad hooned ruutkilomeetristesse ühikruutudesse ning
        # andmete üleslaadimisel töödeldakse kaste ükshaaval sorteeritud järjestuses.
        # Järgmised paar rida on lisatud peale esialgse prototüübi testimist.
        yhikruut = bbox1[0] // 1000, bbox1[1] // 1000
        if yhikruut not in overlapping:
            overlapping[yhikruut] = dict()
        overlapping[yhikruut][way_id] = set()
        for e in util.shp_id_generator(bbox1, etak_grid):
            bbox2 = sf.shape(e).bbox  # Külgnevuskast L_Est97 koordinaatides
            bbox2 = [bbox2[1], bbox2[0], bbox2[3], bbox2[2]]  # X ja Y osade vahetamine
            if util.bbox_overlap(bbox1, bbox2):
                cover = round(util.bbox_cover(bbox1, bbox2) * 100, 2)  # Kattuvuse protsent
                if min_overlap_threshold > cover:
                    # Alla 15% kattuvus jäetakse vahele.
                    continue
                # Aadressi otsimine vajab lisatööd
                # Vaja lahendust, kuidas hinnata sarnasust
                MA_adr = util.get_MA_address(sf.record(e).as_dict())
                dist = util.bbox_dist(bbox1, bbox2)  # Kahe kasti omavaheline kaugus
                adrs_kate = OSM_adr and (OSM_adr in MA_adr or MA_adr in OSM_adr)
                overlapping[yhikruut][way_id].add((cover, dist, adrs_kate, e, way_id, *OSM_adr, *MA_adr))
                # print(i, e, result.ways[i].id, sf.record(e).etak_id, MA_adr,y, cover, sep='\t')
                # print(i,e)
    f = open(overlap_cache_fname, 'w', encoding='utf8')
    print(overlapping, file=f)
    f.close()
inf.update(0, 1, 'Kattuvuste tabeli koostamine')
print('Väljund tabelina.', util.bench())
with open(overlap_csv_fname[:-4] + '_' + timestamp + overlap_csv_fname[-4:], 'w', newline='', encoding='utf8') as csvfile:
    csvwriter = csv.writer(csvfile, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    csvwriter.writerow(['Kattuvuse %', 'Keskpunktide kaugus (m)', 'Ads-check', 'SHP-ID', 'OSM-ID',
                        'etak OSM', 'street', 'housenumber', 'housename', 'etak MA', 'ads_lahiaa'])
    for yhikruut in overlapping:
        for way_id in overlapping[yhikruut]:
            for item in overlapping[yhikruut][way_id]:
                try:
                    csvwriter.writerow( list(map(lambda x: str(x).replace('.', ','), 
                                        item[:2])) + [str(item[2]).upper()] + list(item[3:]))
                except UnicodeEncodeError:
                    print('Unicode viga real', *row)

print(util.bench())

# Lisada mitme hoone korraga kontroll
# https://help.openstreetmap.org/questions/44573
# [out:json][timeout:5];(way(id:28087749,28087756);>;<;);out skel;

# Muudatuste tegemine
inf.update(0, 1, 'Andmete üleslaadimine')
changes = 0  # OSM piirab ühe muudatuskogumi 10000 muudatusega. Siin käib nende üle arve pidamine
tulemused = []
util.edit_start()
# Ruudustiku sorteerimine.
# Selleks, et muudatuskogumid liiga laiaks ei veniks,
# jagatakse ruudustik 10 km laiustesse tulpadesse.
ruudud = list(sorted(overlapping, key=lambda x: (x[1] // 10, x[0], x[1] % 10)))

timestamp = str(util.datetime.datetime.today())[:16].replace(' ', '-').replace(':', '-')
output_log = open(upload_log_fname[:-4] + '_' + timestamp + upload_log_fname[-4:], 'w')
node_stats_log = open(node_log_fname[:-4] + '_' + timestamp + node_log_fname[-4:], 'w')
building_count = sum(list(map(lambda x: len(overlapping[x]), overlapping)))

tehtud_hooneid = sum(list(map(lambda x: len(overlapping[x]), ruudud[:eelmine_kord])))
inf.reset(1, '', building_count - tehtud_hooneid, True)
inf.reset(2, '1. muudatuskogumi täituvus', MAX_CHANGESET_EDITS, True)
eelmine_veerg = ruudud[eelmine_kord][1] // 10
cset_counter = 1
try:
    i = 0  # i loendab kõiki töödeldud hooneid
    for yhikruut in ruudud[eelmine_kord:]:
        print(yhikruut)
        if yhikruut[1] // 10 != eelmine_veerg and changes != 0:
            # Lihtne muudatus, millega piiratakse muudatuskogumi laius 10 km-le.
            changes = MAX_CHANGESET_EDITS + 1
        eelmine_veerg = yhikruut[1] // 10
        for way in overlapping[yhikruut]:
            i += 1
            inf.update(1, 1)
            if len(overlapping[yhikruut][way]) > 1:
                tulemus = ('FAIL', 'Valik mitme hoone vahel', way)
                node_stats = None
            elif len(overlapping[yhikruut][way]) == 1:
                muudatusi, resu = util.update_geometry(sf, way, list(overlapping[yhikruut][way])[0][3], changes)
                changes += muudatusi
                if muudatusi > 0:
                    inf.update(2, muudatusi)
                if resu[0] == 'LIMIT' or changes >= MAX_CHANGESET_EDITS:
                    # Kui muudatuskogum saaks täis, tee uus.
                    changes = 0
                    util.edit_end()
                    cset_counter += 1
                    util.edit_start()
                    inf.reset(2, f'{cset_counter}. muudatuskogumi täituvus', MAX_CHANGESET_EDITS, True)
                    muudatusi, resu = util.update_geometry(sf, way, list(overlapping[yhikruut][way])[0][3], changes)
                    changes += muudatusi
                    if muudatusi > 0:
                        inf.update(2, muudatusi)
                if resu[0] == 'SUCCESS':
                    tulemus = resu[:3]
                    node_stats = list(map(str, resu[3]))
                else:
                    print(resu)
                    tulemus = ('FAIL', resu, way)
                    node_stats = None
            else:
                tulemus = ('FAIL', 'Ühtegi sobivat hoonet ei leitud', way)
            tulemused.append(tulemus)
            if type(tulemus[1]) == str:
                print(*tulemus, sep='\t', file=output_log)
                if node_stats:
                    print(*node_stats, sep='\t', file=node_stats_log)
            else:
                for fail in tulemus[1][1]:
                    print(fail[0], fail[1], tulemus[2], (fail[2] if len(fail) > 2 else ''), sep='\t', file=output_log)
    tulemused.append(('STOP', f'Skript lõpetas edukalt {i}. hoone juures.', way))
except KeyboardInterrupt:
    tulemused.append(('STOP', f'Skript katkestatud {i}. hoone juures ({ruudud.index(yhikruut)}. ühikruut {yhikruut})', way))
    print(f'Skript katkestatud {i}. hoone juures ({ruudud.index(yhikruut)}. ühikruut {yhikruut})')

tulemus = tulemused[-1]
if type(tulemus[1]) == str:
    print(*tulemus, sep='\t', file=output_log)
else:
    for fail in tulemus[1][1]:
        print(fail[0], fail[1], tulemus[2], (fail[2] if len(fail) > 2 else ''), sep='\t', file=output_log)
output_log.close()
node_stats_log.close()
util.edit_end()
inf.close()

# Seadistus

exclude_shared_nodes = False
aastaid = 10     # Mitme aasta vanuseid sõlmi otsitakse
grid_size = 100  # Indekseerimise ruudustiku suurus meetrites
buffer_n = 5     # SHP-faili otsingukasti külje kordaja. Kasutatakse SHP faili esimese otsingu tegemiseks.

# Kus kohas jäi eelmine kord pooleli. Info saab logist.
# Vaikimisi 0. Kui skript katkestati, tuleks siia kirjutada,
# mitmenda ruudu juures skript peatati.
eelmine_kord = 71

# Otsitava piirkonna määramine
# Toetatud on piirkonna nimi ("Harjumaa"), OSM elemendi ID ('relation/350585') või külgnevuskast ( (59.19,24.25,59.59,25.33) )
otsinguala='relation/350585'  # NB! Otsingupiirkonna nimi on tõstutundlik.

cache_dir='cache'   # Vahemälu kausta nimi
# Overpassi päringute vahemälu kaust.
overpass_dir = cache_dir+'/overpass-cache'
# Muudatuskogumi maksimaalne suurus
MAX_CHANGESET_EDITS = 10000
# Overpassi server
Overpass_URL='https://overpass.kumi.systems/api/interpreter'
# OSM API kasutajanimi-parool
auth={'user': 'testAdmin',
      'pwd': 'Passw0rd',  # Passw0rd  password
      'api_url': 'http://192.168.136.131:4443'}

shp_fname="ETAK/E_401_hoone_ka.shp"
shp_encoding='iso-8859-1'


# Overpassi päring ei kasuta f-stringiga antavaid muutujaid, sest
# eesmärk oli hoida mall ise overpass-turboga ühilduval kujul.
# Päringul on ingliskeelsed kommentaarid, sest sarnane päring
# lisati kaasa mõnedele ingliskeelsetele kirjadele.
Overpass_mall="""[out:json][timeout:60];  // Vormingu valik
area[name="{{name}}"];    // Piirkonna nime järgi geokodeerimine
(( way["building"](area);	// Get all buildings in area
);>;)->.all;            // and save them into set .all
// Find nodes within .all, that are newer than 10yrs and 
// ...save WAYS containing them into set .new.
(node.all(newer:"{{date:3653 day}}");<;)->.new;
// Subtract new set .new from .all... 
(((way.all; - way.new;););
 >; // ...and get nodes from that set
// We now have nodes that were last edited 10+ yrs ago.
// Then find buildings not connected to anything
<;  // Find all ways passing through any of these nodes
)->.test1;  // and save them to test1
way.test1[!"building"] // Find all non-buildings in test1
// NB! Following two lines have odd syntax to auto-comment them out.
 ;>  // Get nodes of non-buildings
 ;<  // Get all ways passing through any of these nodes
->.test2; // Save results into set test2.
(way.test1; - way.test2;); // Get test1 ways not in test2
(._;>;);  // Overpass auto-fix to get nodes of ways.
out meta;
"""
# Suure ala töötlemiseks on soovitatav kasutada suurt chunk väärtust,
# mis peaks muutma allalaadimise kiiremaks.
chunk = 10000000
# Kui suur peab olema minimaalne külgnevuskastide kattuvus, et skript seda kaaluks.
min_overlap_threshold=15
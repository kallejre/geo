# Taginfo scanner. Python 3.5.1
# Tool is configured to query top 2500 most common values for a key and split them by ; and | symbols.
import urllib.request
import urllib.parse
import json


# Just key without lanes/forward/backward suffixes
key = 'destination:symbol'
# Option whether  same value repeated across lanes...
# is counted just once (False) or multiple times (True)
sum_lanes = False
top_pages = 10
per_page = 25
# If filename is None, result is printed to stdout (python console)
output_filename = None

urlData = "https://taginfo.openstreetmap.org/api/4/key/values?filter=all&lang=en&"\
    "sortname=count&sortorder=desc&rp=" + str(per_page) + "&qtype=value&format=json&"
def scan(key, Range=(1,top_pages+1)):
    split_lanes=':lanes' in key
    results=dict()
    print(key)
    for page in range(*Range):
        params={'key':key,'page':page}
        print(urlData+urllib.parse.urlencode(params))
        # When umlauts are needed, use urllib.request.quote
        webURL = urllib.request.urlopen(urlData+urllib.parse.urlencode(params))
        data = webURL.read()
        encoding = webURL.info().get_content_charset('utf-8')
        result = json.loads(data.decode(encoding))
        # print(len(result['data']))
        if len(result['data'])==0:
            break  # Stops if last empty list is received
        for res in result['data']:
            c=res['count']
            val=res['value']
            if '; ' in val or '| ' in val:
                # Prints notification about incorrectly formatted value
                print(val)
            if not sum_lanes:
                val=';'.join(set(val.replace('|', ';').split(';')))
            if split_lanes or 1:
    # I had to add ´or 1` because so many tags missed `:lanes` suffix
                val=val.split('|')
            else:
                val=[val]
            for v2 in val:
                # Per each lane
                for v3 in v2.split(';'):
                    # Individual value
                    v3=v3.strip()
                    if not v3 or v3=='none': continue
                    if v3 in results:
                        results[v3]+=c
                    else:
                        results[v3]=c
    return results
a1=scan(key)
a2=scan(key+':lanes')
a1={k: a1.get(k, 0) + a2.get(k, 0) for k in set(a1) | set(a2)}
a2=scan(key+':forward')
a1={k: a1.get(k, 0) + a2.get(k, 0) for k in set(a1) | set(a2)}
a2=scan(key+':backward')
a1={k: a1.get(k, 0) + a2.get(k, 0) for k in set(a1) | set(a2)}
a2=scan(key+':lanes:forward')
a1={k: a1.get(k, 0) + a2.get(k, 0) for k in set(a1) | set(a2)}
a2=scan(key+':lanes:backward')
merged={k: a1.get(k, 0) + a2.get(k, 0) for k in set(a1) | set(a2)}
if output_filename:
    file=open(output_filename, 'w', encoding='utf8')
else:
    file=None
for key in sorted(merged, key=lambda x: merged[x], reverse=True):
    print(key, merged[key], sep='\t', file=file)
if output_filename:
    file.close()
# Output can be copied from console and pasted to spreadsheet.

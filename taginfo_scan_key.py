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
top_pages = 100
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
        # print(urlData+urllib.parse.urlencode(params))
        print(key, page, '/', Range[1]-1)
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
def run_queries():
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
    return merged
# """
merged=run_queries()
sorted_values=sorted(merged, key=lambda x: merged[x], reverse=True)
"""
if output_filename:
    file=open(output_filename, 'w', encoding='utf8')
else:
    file=None
for key in sorted_values:
    print(key, merged[key], sep='\t', file=file)
    if merged[key]<5: break
if output_filename:
    file.close()
# """
def get_page(title='Key:'+key):    
    # Get current page
    # While this is json, there's no point in parsing it.
    url='https://wiki.openstreetmap.org/w/api.php?action=query&prop=revisions&titles={{title}}&rvslots=*&rvprop=content&formatversion=1&format=json'
    url=url.replace('{{title}}', title)
    webURL = urllib.request.urlopen(url)
    data = webURL.read().decode()
    import re
    # Finds all values defined on page
    regex = r"{{Tag\|+[\w:]+\|+(\w+)}}"
    matches = re.finditer(regex, data, re.MULTILINE)
    match_set=set()
    for i in matches: match_set.add(i.group(1))
    return match_set
# Output can be copied from console and pasted to spreadsheet.
def wikitable():
    # Wikitable generator
    rows=30
    cols=4
    table=[ [ [] for i in range(cols)] for i in range(rows)]
    exact_match = get_page()
    close_match=';'.join(exact_match).lower()
    # Non-semantic assessment of tag similarity.
    for i in range(rows*cols):
        value=sorted_values[i]
        count=merged[value]
        if value in exact_match: t='yes'
        elif value.lower() in close_match: t='maybe'
        else: t='no'
        close_match+=';'+value
        row=i%rows
        col=i//rows
        table[row][col]=[value, count,t]
    print('{| class="wikitable"\n|-\n! Value !! Count !! Value !! Count !! Value !! Count !! Value !! Count ')
    for row in table:
        print('|-')
        line=[]
        for col in row:
            line.append(f'| {{{{{col[2]}|{col[0]}}}}} || {{{{{col[2]}|{col[1]}}}}} ')
        print('|'.join(line))
    print('|}')
wikitable()

# Wrapper for https://github.com/amandasaurus/osm-mapping-party-before-after script to generate animation of OSM map changes
# UNIX ONLY, ffmpeg required
import os, sys, subprocess, shutil

bbox = "24.709036,59.397752,24.913141,59.464277"
bbox = "-74.281479,39.931876,-74.100891,40.067059"
bbox = "-74.28856,39.9383,-74.13,40.0"
script_dir = "/home/user/osm-mapping-party-before-after"
script_location = script_dir + "/make.sh"
region_dir = script_dir + "/NE-USA"  # EMPTY Dir which is used for image frames
map_filename = "~/estonia-internal-2021-07-27"
map_filename = "~/us-northeast-internal-2021-08-01"
map_filename_ext = ".osh.pbf"
min_zoom = 14
max_zoom = max(min_zoom, 14)
mp4_zoom = 14

# Base 4 conversion was experimant to make bounding boxes unique by appending zeroes to them. It didn't work.
def to_base_4(n):
    s = ""
    while n:
        s = str(n % 4) + s
        n =n //4
    return "0"*(4-len(s))+s


ts=[]
for y in range(7,22):
    for m in range(1,13, 1):
        ts.append("20%02d-%02d-01T00:00:00Z" % (y,m))

os.system("createdb")
c = 0
try:
    while ts:
        zeros=list(map(lambda x: "0"*int(x), to_base_4(c)))
        date1=ts.pop(0)
        c += 1
        if not ts:
            date2=date1
        else:
            date2=ts.pop(0)
        # box=f"24.709036{zeros[0]}001,59.397752{zeros[1]}001,24.913141{zeros[2]}001,59.464277{zeros[3]}001"
        print(date1, date2)
        cmd=f"{script_location} {map_filename}{map_filename_ext} {date1} {date2} {bbox} {min_zoom} {max_zoom} 2> /dev/null"
        print(cmd)
        print()
        res=os.system(cmd)
        if res:
            print("ERROR with",cmd)
except KeyboardInterrupt:
    print("interrupt received")
    input("Press Ctrl+C again")
# Find files used for animation
files = os.listdir(script_dir)
frames = list(sorted(filter(lambda x: (not 'progress' in x) and 'z'+str(mp4_zoom)+'.png' in x, files)))
# Move animation frames to separate folder.
shutil.rmtree(region_dir)
os.makedirs(region_dir)
for file in frames:
    os.rename(script_dir+'/'+file, region_dir+'/'+file)
# Make mp4
FPS = 6
QUALITY = 4  # Lower is better, higher gives smaller filesize
OUT_FNAME = 'NE-USA'
os.chdir(script_dir)
# ffmpeg -r 15 -f image2 -pattern_type glob -i "*?png" -vcodec libx264 -crf 12 -pix_fmt yuv420p output_q12.mp4
cmd = f'ffmpeg -r {FPS} -f image2 -pattern_type glob -i "{region_dir}/*?png" -vcodec libx264 -crf {QUALITY} -vf scale=240:-2 -pix_fmt yuv420p {OUT_FNAME}_q{QUALITY}.mp4'
print(cmd)
res=os.system(cmd)

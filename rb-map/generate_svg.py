# Alternative map creator
# Super simple and basic map creation solution,
# that works by injecting css within microstate_map.svg
import csv,colorsys, os
output_style=[]
style_template=".{} {{ fill: #{};}}"
date='2021-02-23'
fn=f"tags-{date}.csv"
map_template_name='microstate_template.svg'
output_filename="out.svg"

def get_color(tag1, tag2, gradient='RWG'):
    # This line produces percentage in range 0.0-1.0
    ratio=min(max(0.0,tag2/(tag1+tag2) if tag1+tag2!=0 else 1.0),1.0)
    # Next part is maping it smoothly to RGB values. Colorsys uses 0-1 values
    # Feel free to modify this part to support other color gradients
    if gradient.upper()=='RWG' or True:  # Remove True if you add more gradients.
        if ratio<=0.5:
            h=0
        else: h=1/3  # Green
        l=1.0-abs(ratio-0.5)*1.3  # Luminosity, 0.5-1.0-0.5
        l=max(0.0,min(1.0,l))
        s=(abs(ratio-0.5)*2)**3
        col=colorsys.hls_to_rgb(h,l,1.0)
        
    # Finally it converts color to hex-color.
    return ''.join(list(map(lambda x:"{0:02x}".format(int(x*255)), col))).lower()

def draw_map(input_filename, output_filename):
    with open(input_filename, encoding='utf8') as f:
        for l in csv.reader(f):
            try:
                iso,name,rb,wr=l
                color=get_color(int(rb), int(wr))
                output_style.append(style_template.format(iso.lower(),color))
            except ValueError:
                print("Problem with", l)

    with open(map_template_name, 'r') as f:
        content=f.read()
    with open(output_filename, 'w', encoding='utf8') as f:
        f.write(content.replace('// Replace with colours', '\n'.join(output_style)))

if __name__ =="__main__":
    files=os.listdir(r"C:\Python\history")
    lines=[]
    for fn in files:
        draw_map(r"C:\Python\history" +"\\" + fn,r"C:\Python\svgs" +"\\" + fn.replace('csv','svg'))


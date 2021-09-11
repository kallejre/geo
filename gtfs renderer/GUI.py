import random
import subprocess
from tkinter import *
from tkinter import filedialog
import requests
import config
import time

selector_counter_str = '{} selected\n{} deselected'


def move_items(from_list, to_list, all=False):
    values = list(from_list.list.get())
    if not all:
        indexes = from_list.selection
    else:
        indexes = tuple(range(len(values)))
    if not indexes: return  # If nothing is selected
    # Add items to to_list
    position = len(to_list.list.get())
    for item in sorted(map(lambda x: values[x], indexes), key=lambda x: x.lower()):
        to_list.insert(item)
    # Deselect from_list
    from_list.listbox.select_clear(0, max(indexes) + 2)
    # Remove moved items from from_list
    for idx in sorted(indexes, reverse=True):
        values.pop(idx)
    from_list.list.set(values)
    # Post-transfer updates.
    update_layer_info()

def update_layer_info():
    update_selector_label()
    timestamp=save_config()
    generate_config_url(timestamp)
    draw_image(temp_url.get().format(x=1, y=3, z=7))


def move_all_AB():
    move_items(SBox_A, SBox_B, True)


def move_all_BA():
    move_items(SBox_B, SBox_A, True)


def move_sel_AB():
    move_items(SBox_A, SBox_B, False)


def move_sel_BA():
    move_items(SBox_B, SBox_A, False)


def update_selector_label():
    txt = selector_counter_str.format(len(SBox_B.list.get()), len(SBox_A.list.get()))
    # print(txt)
    selector_label.config(text=txt)


def generate_config_url(timestamp=None):
    copy_url_btn['state'] = "normal"
    suffix=""
    if timestamp:
        suffix = "?t="+str(int(timestamp))
    temp_url.set(config.URL + suffix)


def save_config():
    folder_selected
    timestamp=int(time.time())
    layers=SBox_B.list.get()
    print(folder_selected, layers, timestamp)
    with open("layers.txt", "w") as f:
        print(timestamp, folder_selected, file=f)
        for layer in layers:
            print(layer, file=f)
    return timestamp


def copy_to_clipboard():
    text = temp_url.get()
    root.clipboard_clear()
    root.clipboard_append(text)
    root.update()  # https://stackoverflow.com/a/4203897
    


class Scrollbox(Frame):
    def __init__(self, root, **kwargs):
        super().__init__(root)
        self.list = Variable(value=[])
        self.listbox = Listbox(self, listvariable=self.list, exportselection=False, **kwargs)
        self.listbox.pack(side=LEFT, fill=BOTH, expand=True)
        self.scrollbar = Scrollbar(self)
        self.scrollbar.pack(side=RIGHT, fill=BOTH)
        self.listbox.config(yscrollcommand=self.scrollbar.set)
        self.scrollbar.config(command=self.listbox.yview)

    @property
    def selection(self):
        return self.listbox.curselection()

    def insert(self, item, index=None):
        if not index:
            index = END
        self.listbox.insert(END, item)


def draw_image(url):
    global picture_file
    filename='tmp_tile.png'
    if "://" in url:
        r = requests.get(url, allow_redirects=True)
        open('tmp_tile.png', 'wb').write(r.content)
    else:
        print(url)
        filename=url
    # Works by first downloading file locally and then drawing image on canvas
    picture_file = PhotoImage(file=filename)
    worthAThousandWords.create_image(0, 0, anchor=NW, image=picture_file)
    root.update()


root = Tk()

# This is the section of code which creates the main window
root.geometry('400x500')
root.configure()
root.title('GTFS renderer control panel')

# This is the section of code which creates a listbox
SBox_A = Scrollbox(root, width=0, height=0, selectmode="extended")
SBox_A.insert('Walnuts')
SBox_A.insert('corn')
SBox_A.insert('Italian bread')
SBox_A.insert('chimichanga')
SBox_A.insert('jambalaya')
SBox_A.insert('crab')
SBox_A.insert('Milk')
SBox_A.insert('Lamb')
SBox_A.insert('BBQ')
SBox_A.insert('babaganoosh')
SBox_A.grid(row=0, column=0, rowspan=8, sticky="NSEW")

# This is the section of code which creates a button to copy URL
copy_url_btn = Button(root, text='Copy URL', command=copy_to_clipboard, state="disabled")
copy_url_btn.grid(row=7, column=1, rowspan=1, sticky="NSEW")

# This is the section of code which creates a listbox
SBox_B = Scrollbox(root, width=0, height=15, selectmode="extended")

SBox_B.listbox.insert('0', 'French dip')
for i in range(20):
    SBox_B.listbox.insert(str(i), hex(random.randint(16 ** 7, 16 ** 8 - 1))[2:])

SBox_B.grid(row=0, column=2, rowspan=8, sticky="NSEW")

# This is the section of code which creates a button
X = 1
Y = 1
Button(root, text='>>', command=move_all_AB).grid(column=X, row=Y * 1, rowspan=1, sticky="NSEW")
Button(root, text='>', command=move_sel_AB).grid(column=X, row=Y * 2, rowspan=1, sticky="NSEW")
Button(root, text='<', command=move_sel_BA).grid(column=X, row=Y * 4, rowspan=1, sticky="NSEW")
Button(root, text='<<', command=move_all_BA).grid(column=X, row=Y * 5, rowspan=1, sticky="NSEW")
selector_label = Label(root, text='0 selected\n0 deselected')
selector_label.grid(column=X, row=Y * 3, rowspan=1, sticky="NSEW")
update_selector_label()
temp_url = StringVar()
temp_url.set("Imagery url here")
url_box = Entry(root, textvariable=temp_url, state='readonly')
url_box.grid(row=9, column=0, columnspan=3, sticky="NSEW")

root.columnconfigure(0, weight=3)
root.columnconfigure(1, weight=1)
root.columnconfigure(2, weight=3)
root.rowconfigure(3, weight=1)
worthAThousandWords = Canvas(root, height=256, width=256)
worthAThousandWords.grid(row=11, column=0, columnspan=4)

draw_image("https://tile.openstreetmap.org/8/147/73.png")

folder_selected = filedialog.askdirectory(title="Please select GTFS directory to be loaded...")
print(folder_selected)
# load_gtfs_from_folder(folder_selected)
print("Starting web server (flask is needed")
proc=subprocess.Popen(["python", "backend.py"])
root.mainloop()
print("Killing web server")
proc.terminate()

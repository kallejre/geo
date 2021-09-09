import tkinter as tk
from tkinter import ttk
from tkinter import * 

# Automatically generated UI basics made with http://www.python-gui-builder.com/

# this is a function to get the selected list box value
def getListboxValue():
	itemSelected = listBoxOne.curselection()
	return itemSelected


# this is a function which returns the selected combo box item
def getSelectedComboItem():
	return comboOneTwoPunch.get()


# this is the function called when the button is clicked
def btnClickFunction():
	print('clicked')


# this is the function called when the button is clicked
def btnClickFunction():
	print('clicked')


# this is a function to get the selected list box value
def getListboxValue():
	itemSelected = listBoxTwo.curselection()
	return itemSelected


# this is the function called when the button is clicked
def btnClickFunction():
	print('clicked')


# this is the function called when the button is clicked
def btnClickFunction():
	print('clicked')


# this is a function to get the user input from the text input box
def getInputBoxValue():
	userInput = tInput.get()
	return userInput


class Scrollbox(Frame):
    def __init__(self, root, **kwargs):
        super().__init__(root)
        self.listbox = Listbox(self, **kwargs)
        self.listbox.pack(side = LEFT, fill = BOTH)
        self.scrollbar = Scrollbar(self)
        self.scrollbar.pack(side = RIGHT, fill = BOTH)
          
        # Insert elements into the listbox
        #for values in range(100):
        #    self.listbox.insert(END, values)
        
        self.listbox.config(yscrollcommand = self.scrollbar.set)
        self.scrollbar.config(command = self.listbox.yview)


root = Tk()

# This is the section of code which creates the main window
root.geometry('400x500')
root.configure()
root.title('Hello, I\'m the main window')


# This is the section of code which creates a listbox
listBoxOne=Scrollbox(root, width=0, height=0, selectmode = "extended")
listBoxOne.listbox.insert('0', 'Walnuts')
listBoxOne.listbox.insert('1', 'corn')
listBoxOne.listbox.insert('2', 'Italian bread')
listBoxOne.listbox.insert('3', 'chimichanga')
listBoxOne.listbox.insert('4', 'jambalaya')
listBoxOne.listbox.insert('5', 'crab')
listBoxOne.listbox.insert('6', 'Milk')
listBoxOne.listbox.insert('7', 'Lamb')
listBoxOne.listbox.insert('8', 'BBQ')
listBoxOne.listbox.insert('9', 'babaganoosh')
listBoxOne.grid(row=0, column=0, rowspan=8, sticky="NSEW")


# This is the section of code which creates a combo box
comboOneTwoPunch= ttk.Combobox(root, values=['chocolate', 'beer', 'Englishmuffins', 'duck', 'Italian bread'], width=10)
comboOneTwoPunch.grid(row=7, column=1, rowspan=1)
comboOneTwoPunch.current(1)


# This is the section of code which creates a listbox
listBoxTwo=Scrollbox(root, width=0, height=15, selectmode = "extended")
listBoxTwo.listbox.insert('0', 'French dip')
listBoxTwo.listbox.insert('1', 'bluefish')
listBoxTwo.listbox.insert('2', 'Moose')
listBoxTwo.listbox.insert('3', 'bread')
listBoxTwo.listbox.insert('4', 'eggs')
listBoxTwo.listbox.insert('6', 'Linguine')
listBoxTwo.listbox.insert('7', 'Noodles')
listBoxTwo.listbox.insert('8', 'hamburger')
listBoxTwo.listbox.insert('9', 'Indian food')
listBoxTwo.listbox.insert('10', 'Guancamole')
listBoxTwo.listbox.insert('11', 'dips')
listBoxTwo.listbox.insert('12', 'antelope')
listBoxTwo.listbox.insert('13', 'grapes')
listBoxTwo.listbox.insert('14', 'goose')
listBoxTwo.listbox.insert('13', 'grapes')
listBoxTwo.listbox.insert('14', 'goose')
listBoxTwo.listbox.insert('13', 'grapes')
listBoxTwo.listbox.insert('14', 'goose')
listBoxTwo.grid(row=0, column=2, rowspan=8, sticky="NSEW")


# This is the section of code which creates a button
X = 1
Y = 1
Button(root, text='>>', command=btnClickFunction).grid(column=X, row=Y*1, rowspan=1, sticky="NSEW")
Button(root, text='>', command=btnClickFunction).grid(column=X, row=Y*2, rowspan=1, sticky="NSEW")
Label( root, text='0 selected').grid(column=X, row=Y*3, rowspan=1, sticky="NSEW")
Button(root, text='<',command=btnClickFunction).grid(column=X, row=Y*4, rowspan=1, sticky="NSEW")
Button(root, text='<<', command=btnClickFunction).grid(column=X, row=Y*5, rowspan=1, sticky="NSEW")

url_box=Entry(root)
url_box.grid(row=9, column=0, columnspan=3, sticky="NSEW")

# First, we create a canvas to put the picture on
worthAThousandWords= Canvas(root, height=256, width=256)
# Then, we actually create the image file to use (it has to be a *.gif)
picture_file = PhotoImage(master=root, file = 'sample.png')  # <-- you will have to copy-paste the filepath here, for example 'C:\Desktop\pic.gif'
# Finally, we create the image on the canvas and then place it onto the main window
worthAThousandWords.create_image(256, 0, anchor=NE, image=picture_file)
worthAThousandWords.grid(row=11, column=0, columnspan=4)
root.mainloop()

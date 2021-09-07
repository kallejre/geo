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

class 

    listbox = Listbox(root)
      
    # Adding Listbox to the left
    # side of root window
    listbox.pack(side = LEFT, fill = BOTH)
      
    # Creating a Scrollbar and 
    # attaching it to root window
    scrollbar = Scrollbar(root)
      
    # Adding Scrollbar to the right
    # side of root window
    scrollbar.pack(side = RIGHT, fill = BOTH)
      
    # Insert elements into the listbox
    for values in range(100):
        listbox.insert(END, values)
          
    # Attaching Listbox to Scrollbar
    # Since we need to have a vertical 
    # scroll we use yscrollcommand
    listbox.config(yscrollcommand = scrollbar.set)
      
    # setting scrollbar command parameter 
    # to listbox.yview method its yview because
    # we need to have a vertical view
    scrollbar.config(command = listbox.yview)
  
  
  




root = Tk()

# This is the section of code which creates the main window
root.geometry('400x500')
root.configure()
root.title('Hello, I\'m the main window')


# This is the section of code which creates a listbox
listBoxOne=Listbox(root, width=0, height=0)
listBoxOne.insert('0', 'Walnuts')
listBoxOne.insert('1', 'corn')
listBoxOne.insert('2', 'Italian bread')
listBoxOne.insert('3', 'chimichanga')
listBoxOne.insert('4', 'jambalaya')
listBoxOne.insert('5', 'crab')
listBoxOne.insert('6', 'Milk')
listBoxOne.insert('7', 'Lamb')
listBoxOne.insert('8', 'BBQ')
listBoxOne.insert('9', 'babaganoosh')
listBoxOne.place(x=41, y=111)


# This is the section of code which creates a combo box
comboOneTwoPunch= ttk.Combobox(root, values=['chocolate', 'beer', 'Englishmuffins', 'duck', 'Italian bread'], width=10)
comboOneTwoPunch.place(x=181, y=161)
comboOneTwoPunch.current(1)


# This is the section of code which creates a button
Button(root, text='>>', command=btnClickFunction).place(x=244, y=256)


# This is the section of code which creates a button
Button(root, text='>', command=btnClickFunction).place(x=266, y=305)


# This is the section of code which creates a listbox
listBoxTwo=Listbox(root, width=0, height=0)
listBoxTwo.insert('0', 'French dip')
listBoxTwo.insert('1', 'bluefish')
listBoxTwo.insert('2', 'Moose')
listBoxTwo.insert('3', 'bread')
listBoxTwo.insert('4', 'eggs')
listBoxTwo.insert('5', 'kabobs')
listBoxTwo.insert('6', 'Linguine')
listBoxTwo.insert('7', 'Noodles')
listBoxTwo.insert('8', 'hamburger')
listBoxTwo.insert('9', 'Indian food')
listBoxTwo.insert('10', 'Guancamole')
listBoxTwo.insert('11', 'dips')
listBoxTwo.insert('12', 'antelope')
listBoxTwo.insert('13', 'grapes')
listBoxTwo.insert('14', 'goose')
listBoxTwo.place(x=286, y=8)


# This is the section of code which creates a button
Button(root, text='<',command=btnClickFunction).place(x=206, y=218)


# This is the section of code which creates a button
Button(root, text='<<', command=btnClickFunction).place(x=194, y=315)


# This is the section of code which creates a text input box
tInput=Entry(root)
tInput.place(x=60, y=392)


# First, we create a canvas to put the picture on
worthAThousandWords= Canvas(root, height=256, width=256)
# Then, we actually create the image file to use (it has to be a *.gif)
picture_file = PhotoImage(file = '')  # <-- you will have to copy-paste the filepath here, for example 'C:\Desktop\pic.gif'
# Finally, we create the image on the canvas and then place it onto the main window
worthAThousandWords.create_image(256, 0, anchor=NE, image=picture_file)
worthAThousandWords.place(x=209, y=366)


root.mainloop()

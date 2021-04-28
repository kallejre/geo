import tkinter as tk
from tkinter import ttk
import time
class info():
    def __init__(self, rows=3, *args, **kwargs):
        """Loob kerimisribade akna."""
        self.aken=tk.Tk(*args, **kwargs)
        self.aken.resizable(width=True, height=False)
        self.rows=rows
        self.label_obj=[0]*rows
        self.progress=[0]*rows
        self.max=[1]*rows
        for i in range(rows):
            self.label_obj[i]  = ttk.Label(self.aken,text='t')
            self.label_obj[i].pack(fill='x')
            self.progress[i] = ttk.Progressbar(self.aken, orient="horizontal", mode="determinate", value=i+0.5, maximum=rows)
            self.progress[i].pack(fill='x')
        self.aken.title('Programm töötab')
        self.prog_val=[0]*rows
        self.aken.geometry("400x"+str(41*self.rows))
        self.t_start=time.time()
        self.label_txt=['']*rows
        self.aken.update()
    def reset(self,lvl, label='', max_val=1, timer=False):
        """Loob/nullib kerimisriba."""
        self.prog_val[lvl]=0
        self.progress[lvl].config(maximum=max_val,value=0)
        self.label_txt[lvl]=label
        self.max[lvl]=max_val
        self.timer=timer
        self.label_obj[lvl].config(text='{0} {1}/{2}'.format(self.label_txt[lvl],self.prog_val[lvl],self.max[lvl]))
        self.t_start=time.time()
        self.aken.update()
    def update(self, lvl, change=1, label=None):
        """Uuendab kerimisriba."""
        if label:self.label_txt[lvl]=label
        self.prog_val[lvl]+=change
        self.prog_val[lvl]=round(self.prog_val[lvl],4)
        self.progress[lvl].config(value=self.prog_val[lvl])
        if self.timer:
            t_cur=time.time()
            if self.prog_val[lvl]!=0:
                eta=round(self.t_start-t_cur+((t_cur-self.t_start)/self.prog_val[lvl]*self.max[lvl]))
            else:
                eta=float('inf')
            self.label_obj[lvl].config(text='{0} {1}/{2}  {3}s veel'.format(self.label_txt[lvl],self.prog_val[lvl],self.max[lvl],eta))
        else:
            self.label_obj[lvl].config(text='{0} {1}/{2}'.format(self.label_txt[lvl],self.prog_val[lvl],self.max[lvl]))
        self.aken.update()
    def ask_close(self):
        """Lisab sulgemisnupu."""
        s=ttk.Button(self.aken,command=self.aken.destroy, text='Sulge')
        s.pack()
        self.aken.geometry("400x"+str(41*self.rows+25))
        self.aken.mainloop()
    def close(self):
        self.aken.destroy()
if __name__ == "__main__":
    a=info(10)
    a.reset(2, 'Silt', 10, True)
    a.update(2,10)
    for i in range(5):
        a.update(2,-1)
    #a.sulg()

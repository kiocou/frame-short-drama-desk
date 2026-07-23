from tkinter import ttk

from ..motion import slide_in


class BasePage(ttk.Frame):
    def __init__(self, master):
        super().__init__(master, style="Page.TFrame")
        self.content = ttk.Frame(self, style="Page.TFrame")
        self.content.place(x=0, y=0, relwidth=1, relheight=1)

    def reveal(self):
        slide_in(self.content)

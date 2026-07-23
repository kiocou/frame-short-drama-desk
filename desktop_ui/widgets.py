"""Reusable native widgets for the desktop shell."""
import tkinter as tk
from tkinter import ttk

from .motion import animate_y
from .theme import COLORS, FONT


class ToolTip:
    def __init__(self, widget, text: str):
        self.widget = widget
        self.text = text
        self.window = None
        self.after_id = None
        widget.bind("<Enter>", self._schedule, add="+")
        widget.bind("<Leave>", self._hide, add="+")

    def _schedule(self, _event=None):
        self._hide()
        self.after_id = self.widget.after(450, self._show)

    def _show(self):
        if self.window or not self.widget.winfo_exists():
            return
        self.window = tk.Toplevel(self.widget)
        self.window.overrideredirect(True)
        x = self.widget.winfo_rootx() + self.widget.winfo_width() + 8
        y = self.widget.winfo_rooty() + 8
        self.window.geometry(f"+{x}+{y}")
        tk.Label(self.window, text=self.text, bg=COLORS["ink"], fg="#FFFFFF", padx=8, pady=5, font=(FONT, 8)).pack()

    def _hide(self, _event=None):
        if self.after_id:
            try:
                self.widget.after_cancel(self.after_id)
            except Exception:
                pass
            self.after_id = None
        if self.window:
            self.window.destroy()
            self.window = None


class SidebarButton(tk.Button):
    def __init__(self, master, icon: str, label: str, command):
        self.icon = icon
        self.label = label
        super().__init__(
            master,
            text=f"{icon}    {label}",
            anchor="w",
            command=command,
            relief="flat",
            borderwidth=0,
            highlightthickness=0,
            bg=COLORS["rail"],
            fg=COLORS["rail_muted"],
            activebackground=COLORS["rail_hover"],
            activeforeground="#FFFFFF",
            font=(FONT, 10),
            cursor="hand2",
            padx=20,
            pady=13,
        )
        self.bind("<Enter>", self._hover, add="+")
        self.bind("<Leave>", self._leave, add="+")
        self.active = False
        ToolTip(self, label)

    def set_active(self, active: bool):
        self.active = active
        self.configure(
            bg=COLORS["rail_hover"] if active else COLORS["rail"],
            fg="#FFFFFF" if active else COLORS["rail_muted"],
            font=(FONT, 10, "bold" if active else "normal"),
        )

    def _hover(self, _event=None):
        if not self.active:
            self.configure(bg=COLORS["rail_hover"], fg="#FFFFFF")

    def _leave(self, _event=None):
        if not self.active:
            self.configure(bg=COLORS["rail"], fg=COLORS["rail_muted"])


class NavRail(tk.Frame):
    ITEMS = (
        ("home", "01", "工作台"),
        ("search", "02", "片库搜索"),
        ("tasks", "03", "下载队列"),
        ("settings", "04", "系统设置"),
    )

    def __init__(self, master, on_select):
        super().__init__(master, width=210, bg=COLORS["rail"], highlightthickness=0)
        self.pack_propagate(False)
        self.buttons = {}
        brand = tk.Frame(self, bg=COLORS["rail"])
        brand.pack(fill="x", padx=22, pady=(25, 34))
        tk.Label(brand, text="FRAME", bg=COLORS["rail"], fg="#FFFFFF", font=(FONT, 18, "bold"), anchor="w").pack(fill="x")
        tk.Label(brand, text="DESKTOP EDITION / 2026", bg=COLORS["rail"], fg=COLORS["rail_muted"], font=(FONT, 7), anchor="w").pack(fill="x", pady=(3, 0))
        for key, icon, label in self.ITEMS:
            if key == "settings":
                tk.Frame(self, bg=COLORS["rail"]).pack(fill="both", expand=True)
            button = SidebarButton(self, icon, label, lambda value=key: on_select(value))
            button.pack(fill="x", padx=0, pady=1)
            self.buttons[key] = button
        self.indicator = tk.Frame(self, width=4, height=46, bg=COLORS["primary"])
        self._active = None

    def set_active(self, key: str, animate: bool = True):
        if key not in self.buttons:
            return
        for name, button in self.buttons.items():
            button.set_active(name == key)
        self.update_idletasks()
        target_y = self.buttons[key].winfo_y() + max(0, (self.buttons[key].winfo_height() - 46) // 2)
        if self._active is None:
            self.indicator.place(x=206, y=target_y)
        elif animate:
            animate_y(self.indicator, target_y)
        else:
            self.indicator.place_configure(y=target_y)
        self._active = key


class Surface(ttk.Frame):
    def __init__(self, master, **kwargs):
        kwargs.setdefault("style", "Surface.TFrame")
        kwargs.setdefault("borderwidth", 1)
        kwargs.setdefault("relief", "solid")
        super().__init__(master, **kwargs)

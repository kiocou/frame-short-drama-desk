"""Visual tokens for the Film Desk editorial desktop theme."""
from tkinter import ttk


COLORS = {
    "canvas": "#F2F1ED",
    "surface": "#FCFBF8",
    "surface_alt": "#E8E6E0",
    "primary": "#E3452F",
    "primary_hover": "#C93623",
    "primary_soft": "#F7DDD7",
    "coral": "#171717",
    "coral_hover": "#303030",
    "coral_soft": "#E7E4DE",
    "ink": "#171717",
    "muted": "#686762",
    "faint": "#98968F",
    "line": "#C9C6BE",
    "line_soft": "#DEDCD5",
    "success": "#17745B",
    "warning": "#A06412",
    "danger": "#C93623",
    "disabled": "#AAA7A0",
    "rail": "#171717",
    "rail_hover": "#292929",
    "rail_muted": "#A9A69E",
    "blue": "#3157C8",
}

FONT = "Microsoft YaHei UI"


def apply_theme(root):
    """Apply a precise, low-overhead native theme and return its style object."""
    style = ttk.Style(root)
    try:
        style.theme_use("clam")
    except Exception:
        pass

    root.configure(bg=COLORS["canvas"])
    root.option_add("*Font", (FONT, 9))

    style.configure("TFrame", background=COLORS["canvas"])
    style.configure("Page.TFrame", background=COLORS["canvas"])
    style.configure("Surface.TFrame", background=COLORS["surface"], bordercolor=COLORS["ink"])
    style.configure("Header.TFrame", background=COLORS["surface"])
    style.configure("Rail.TFrame", background=COLORS["surface"])

    style.configure("TLabel", background=COLORS["canvas"], foreground=COLORS["ink"], font=(FONT, 9))
    style.configure("Surface.TLabel", background=COLORS["surface"], foreground=COLORS["ink"], font=(FONT, 9))
    style.configure("Muted.TLabel", background=COLORS["canvas"], foreground=COLORS["muted"], font=(FONT, 9))
    style.configure("Muted.Surface.TLabel", background=COLORS["surface"], foreground=COLORS["muted"], font=(FONT, 9))
    style.configure("PageTitle.TLabel", background=COLORS["canvas"], foreground=COLORS["ink"], font=(FONT, 21, "bold"))
    style.configure("Title.TLabel", background=COLORS["surface"], foreground=COLORS["ink"], font=(FONT, 15, "bold"))
    style.configure("Section.TLabel", background=COLORS["canvas"], foreground=COLORS["ink"], font=(FONT, 11, "bold"))
    style.configure("Section.Surface.TLabel", background=COLORS["surface"], foreground=COLORS["ink"], font=(FONT, 11, "bold"))
    style.configure("Metric.TLabel", background=COLORS["canvas"], foreground=COLORS["ink"], font=(FONT, 14, "bold"))
    style.configure("Status.TLabel", background=COLORS["ink"], foreground="#FFFFFF", padding=(11, 7), font=(FONT, 9, "bold"))
    style.configure("Warning.TLabel", background=COLORS["coral_soft"], foreground=COLORS["danger"], padding=(10, 6), font=(FONT, 9))

    button_base = {"padding": (13, 8), "font": (FONT, 9, "bold"), "borderwidth": 0, "focuscolor": ""}
    style.configure("TButton", background=COLORS["surface_alt"], foreground=COLORS["ink"], **button_base)
    style.map("TButton", background=[("active", COLORS["line_soft"]), ("pressed", COLORS["line"])], foreground=[("disabled", COLORS["disabled"])])
    style.configure("Primary.TButton", background=COLORS["primary"], foreground="#FFFFFF", **button_base)
    style.map("Primary.TButton", background=[("active", COLORS["primary_hover"]), ("pressed", COLORS["primary_hover"]), ("disabled", COLORS["disabled"])])
    style.configure("Signal.TButton", background=COLORS["primary"], foreground="#FFFFFF", **button_base)
    style.map("Signal.TButton", background=[("active", COLORS["primary_hover"]), ("pressed", COLORS["primary_hover"]), ("disabled", COLORS["disabled"])])
    style.configure("Coral.TButton", background=COLORS["coral"], foreground="#FFFFFF", **button_base)
    style.map("Coral.TButton", background=[("active", COLORS["coral_hover"]), ("pressed", COLORS["coral_hover"]), ("disabled", COLORS["disabled"])])
    style.configure("Ink.TButton", background=COLORS["ink"], foreground="#FFFFFF", **button_base)
    style.map("Ink.TButton", background=[("active", COLORS["rail_hover"]), ("pressed", COLORS["rail_hover"]), ("disabled", COLORS["disabled"])])
    style.configure("Ghost.TButton", background=COLORS["canvas"], foreground=COLORS["blue"], padding=(8, 5), borderwidth=0, font=(FONT, 9, "bold"))
    style.map("Ghost.TButton", background=[("active", COLORS["primary_soft"])])
    style.configure("Danger.TButton", background=COLORS["coral_soft"], foreground=COLORS["danger"], **button_base)
    style.map("Danger.TButton", background=[("active", "#F1D4CD")])

    style.configure("TEntry", fieldbackground=COLORS["surface"], foreground=COLORS["ink"], insertcolor=COLORS["ink"], bordercolor=COLORS["line"], lightcolor=COLORS["line"], darkcolor=COLORS["line"], padding=(10, 8))
    style.map("TEntry", bordercolor=[("focus", COLORS["primary"])], lightcolor=[("focus", COLORS["primary"])], darkcolor=[("focus", COLORS["primary"])])
    style.configure("TCombobox", fieldbackground=COLORS["surface"], background=COLORS["surface"], foreground=COLORS["ink"], arrowcolor=COLORS["primary"], bordercolor=COLORS["line"], padding=(8, 6))
    style.map("TCombobox", bordercolor=[("focus", COLORS["primary"])], fieldbackground=[("readonly", COLORS["surface"])], foreground=[("readonly", COLORS["ink"])])

    style.configure("Treeview", background=COLORS["surface"], fieldbackground=COLORS["surface"], foreground=COLORS["ink"], rowheight=42, borderwidth=0, font=(FONT, 9))
    style.configure("Treeview.Heading", background=COLORS["ink"], foreground="#FFFFFF", borderwidth=0, relief="flat", padding=(10, 10), font=(FONT, 9, "bold"))
    style.map("Treeview", background=[("selected", COLORS["primary_soft"])], foreground=[("selected", COLORS["ink"])])
    style.map("Treeview.Heading", background=[("active", COLORS["rail_hover"])])
    style.configure("Film.Treeview", background=COLORS["surface"], fieldbackground=COLORS["surface"], foreground=COLORS["ink"], rowheight=42, borderwidth=0, font=(FONT, 9))
    style.configure("Film.Treeview.Heading", background=COLORS["ink"], foreground="#FFFFFF", borderwidth=0, relief="flat", padding=(10, 10), font=(FONT, 9, "bold"))
    style.map("Film.Treeview", background=[("selected", COLORS["primary_soft"])], foreground=[("selected", COLORS["ink"])])
    style.map("Film.Treeview.Heading", background=[("active", COLORS["rail_hover"])])

    style.configure("Horizontal.TProgressbar", background=COLORS["primary"], troughcolor=COLORS["line_soft"], borderwidth=0, thickness=7)
    style.configure("Film.Horizontal.TProgressbar", background=COLORS["primary"], troughcolor=COLORS["line_soft"], borderwidth=0, thickness=7)
    style.configure("Coral.Horizontal.TProgressbar", background=COLORS["coral"], troughcolor=COLORS["line_soft"], borderwidth=0, thickness=7)
    style.configure("TCheckbutton", background=COLORS["surface"], foreground=COLORS["ink"], font=(FONT, 9))
    style.map("TCheckbutton", background=[("active", COLORS["surface"])], indicatorcolor=[("selected", COLORS["primary"])])
    style.configure("TSeparator", background=COLORS["line_soft"])
    return style

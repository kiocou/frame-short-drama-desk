from collections import OrderedDict
from tkinter import END, StringVar, ttk

from .base import BasePage
from ..widgets import Surface


class HomePage(BasePage):
    def __init__(self, master, keyword_var, bulk_var, on_search, on_bulk, on_open_tasks):
        super().__init__(master)
        body = self.content
        body.columnconfigure(0, weight=1)
        body.rowconfigure(3, weight=1)

        intro = ttk.Frame(body, style="Page.TFrame")
        intro.grid(row=0, column=0, sticky="ew", padx=28, pady=(24, 16))
        intro.columnconfigure(0, weight=1)
        ttk.Label(intro, text="今日片场 / 01", style="PageTitle.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(intro, text="搜索、解析、下载与成片，在同一张工作台完成。", style="Muted.TLabel").grid(row=1, column=0, sticky="w", pady=(4, 0))

        metrics = ttk.Frame(intro, style="Page.TFrame")
        metrics.grid(row=0, column=1, rowspan=2, sticky="e")
        self.total_var = StringVar(value="0")
        self.active_var = StringVar(value="0")
        self.done_var = StringVar(value="0")
        for col, (label, variable) in enumerate((("全部任务", self.total_var), ("进行中", self.active_var), ("已完成", self.done_var))):
            box = ttk.Frame(metrics, style="Page.TFrame")
            box.grid(row=0, column=col, padx=(22 if col else 0, 0))
            ttk.Label(box, textvariable=variable, style="Metric.TLabel").pack(anchor="e")
            ttk.Label(box, text=label, style="Muted.TLabel").pack(anchor="e")

        launchers = Surface(body, padding=0)
        launchers.grid(row=1, column=0, sticky="ew", padx=28)
        launchers.columnconfigure(0, weight=1)
        launchers.columnconfigure(2, weight=1)

        search_panel = ttk.Frame(launchers, style="Surface.TFrame", padding=20)
        search_panel.grid(row=0, column=0, sticky="nsew")
        search_panel.columnconfigure(0, weight=1)
        ttk.Label(search_panel, text="A / 片库检索", style="Section.Surface.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(search_panel, text="按剧名、类型或来源查找", style="Muted.Surface.TLabel").grid(row=1, column=0, sticky="w", pady=(3, 13))
        search_input = ttk.Frame(search_panel, style="Surface.TFrame")
        search_input.grid(row=2, column=0, sticky="ew")
        search_input.columnconfigure(0, weight=1)
        self.search_entry = ttk.Entry(search_input, textvariable=keyword_var)
        self.search_entry.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.search_button = ttk.Button(search_input, text="开始搜索", style="Signal.TButton", command=on_search)
        self.search_button.grid(row=0, column=1)
        self.search_entry.bind("<Return>", lambda _event: on_search())

        ttk.Separator(launchers, orient="vertical").grid(row=0, column=1, sticky="ns")

        bulk_panel = ttk.Frame(launchers, style="Surface.TFrame", padding=20)
        bulk_panel.grid(row=0, column=2, sticky="nsew")
        bulk_panel.columnconfigure(0, weight=1)
        ttk.Label(bulk_panel, text="B / 快速入队", style="Section.Surface.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(bulk_panel, text="支持分享链接或多个短剧 ID", style="Muted.Surface.TLabel").grid(row=1, column=0, sticky="w", pady=(3, 13))
        bulk_input = ttk.Frame(bulk_panel, style="Surface.TFrame")
        bulk_input.grid(row=2, column=0, sticky="ew")
        bulk_input.columnconfigure(0, weight=1)
        self.bulk_entry = ttk.Entry(bulk_input, textvariable=bulk_var)
        self.bulk_entry.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.bulk_button = ttk.Button(bulk_input, text="识别任务", style="Ink.TButton", command=on_bulk)
        self.bulk_button.grid(row=0, column=1)
        self.bulk_entry.bind("<Return>", lambda _event: on_bulk())

        recent_head = ttk.Frame(body, style="Page.TFrame")
        recent_head.grid(row=2, column=0, sticky="ew", padx=28, pady=(20, 9))
        recent_head.columnconfigure(0, weight=1)
        ttk.Label(recent_head, text="最近任务", style="Section.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Button(recent_head, text="前往任务中心  →", style="Ghost.TButton", command=on_open_tasks).grid(row=0, column=1, sticky="e")

        recent = Surface(body, padding=0)
        recent.grid(row=3, column=0, sticky="nsew", padx=28, pady=(0, 24))
        recent.rowconfigure(0, weight=1)
        recent.columnconfigure(0, weight=1)
        columns = ("title", "status", "progress")
        self.recent_tree = ttk.Treeview(recent, columns=columns, show="headings", height=5, selectmode="browse", style="Film.Treeview")
        self.recent_tree.heading("title", text="剧集")
        self.recent_tree.heading("status", text="状态")
        self.recent_tree.heading("progress", text="进度")
        self.recent_tree.column("title", width=520, minwidth=240, stretch=True)
        self.recent_tree.column("status", width=150, minwidth=100, stretch=False)
        self.recent_tree.column("progress", width=160, minwidth=110, stretch=False)
        self.recent_tree.grid(row=0, column=0, sticky="nsew")
        self.recent_tree.bind("<Double-1>", lambda _event: on_open_tasks())
        self.empty_label = ttk.Label(recent, text="暂无任务 · 从上方搜索或粘贴链接开始", style="Muted.Surface.TLabel", anchor="center")

    def render_tasks(self, tasks):
        total = len(tasks)
        active = sum(1 for task in tasks if task.get("status") in {"排队中", "下载中"})
        done = sum(1 for task in tasks if task.get("status") == "完成")
        self.total_var.set(str(total))
        self.active_var.set(str(active))
        self.done_var.set(str(done))

        groups = OrderedDict()
        for task in tasks:
            key = str(task.get("series_id") or task.get("id") or len(groups))
            group = groups.setdefault(key, {"title": task.get("series_title") or task.get("title") or key, "total": 0, "done": 0, "failed": 0, "active": 0, "merge": ""})
            group["total"] += 1
            group["done"] += task.get("status") == "完成"
            group["failed"] += task.get("status") == "失败"
            group["active"] += task.get("status") in {"排队中", "下载中"}
            if task.get("merge_status"):
                group["merge"] = task.get("merge_status")

        self.recent_tree.delete(*self.recent_tree.get_children())
        recent_groups = list(groups.values())[-6:]
        for index, group in enumerate(reversed(recent_groups)):
            if group["merge"] == "正在合并":
                status = "正在合并"
            elif group["merge"] == "已合并":
                status = "已合并"
            elif group["failed"]:
                status = f"{group['failed']} 集失败"
            elif group["active"]:
                status = "正在下载"
            elif group["done"] == group["total"]:
                status = "已完成"
            else:
                status = "等待中"
            progress = f"{group['done']} / {group['total']} 集"
            self.recent_tree.insert("", END, iid=str(index), values=(group["title"], status, progress))

        if recent_groups:
            self.empty_label.place_forget()
        else:
            self.empty_label.place(relx=0.5, rely=0.55, anchor="center")

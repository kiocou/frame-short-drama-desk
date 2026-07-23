from tkinter import ttk

from .base import BasePage
from ..widgets import Surface


class SearchPage(BasePage):
    def __init__(
        self,
        master,
        keyword_var,
        page_var,
        source_var,
        category_var,
        detail_var,
        status_var,
        on_search,
        on_download,
        on_open,
        on_export,
        on_clear,
        on_select,
    ):
        super().__init__(master)
        body = self.content
        body.columnconfigure(0, weight=1)
        body.rowconfigure(3, weight=1)

        head = ttk.Frame(body, style="Page.TFrame")
        head.grid(row=0, column=0, sticky="ew", padx=28, pady=(22, 14))
        ttk.Label(head, text="片库搜索 / 02", style="PageTitle.TLabel").pack(anchor="w")
        ttk.Label(head, text="聚合公开来源，选中结果后可解析全集。", style="Muted.TLabel").pack(anchor="w", pady=(4, 0))

        filters = Surface(body, padding=16)
        filters.grid(row=1, column=0, sticky="ew", padx=28)
        filters.columnconfigure(1, weight=1)
        filters.columnconfigure(3, weight=1)
        ttk.Label(filters, text="关键词", style="Surface.TLabel").grid(row=0, column=0, sticky="w", padx=(0, 8))
        self.keyword_entry = ttk.Entry(filters, textvariable=keyword_var)
        self.keyword_entry.grid(row=0, column=1, sticky="ew", padx=(0, 16))
        ttk.Label(filters, text="来源", style="Surface.TLabel").grid(row=0, column=2, sticky="w", padx=(0, 8))
        ttk.Combobox(
            filters,
            textvariable=source_var,
            values=["红果短剧", "红果漫剧", "爱奇艺短剧", "FlexTV", "熊猫短剧", "趣看看短剧", "全网聚合"],
            state="readonly",
            width=18,
        ).grid(row=0, column=3, sticky="ew", padx=(0, 12))
        self.search_button = ttk.Button(filters, text="开始搜索", style="Signal.TButton", command=on_search)
        self.search_button.grid(row=0, column=4, rowspan=2, sticky="ns")

        ttk.Label(filters, text="分类", style="Surface.TLabel").grid(row=1, column=0, sticky="w", padx=(0, 8), pady=(12, 0))
        ttk.Entry(filters, textvariable=category_var).grid(row=1, column=1, sticky="ew", padx=(0, 16), pady=(12, 0))
        ttk.Label(filters, text="页码", style="Surface.TLabel").grid(row=1, column=2, sticky="w", padx=(0, 8), pady=(12, 0))
        ttk.Entry(filters, textvariable=page_var, width=9).grid(row=1, column=3, sticky="w", pady=(12, 0))
        self.keyword_entry.bind("<Return>", lambda _event: on_search())

        status = ttk.Frame(body, style="Page.TFrame")
        status.grid(row=2, column=0, sticky="ew", padx=28, pady=(11, 9))
        status.columnconfigure(1, weight=1)
        ttk.Label(status, textvariable=status_var, style="Muted.TLabel").grid(row=0, column=0, sticky="w", padx=(0, 14))
        self.progress = ttk.Progressbar(status, mode="determinate", maximum=100, value=0, style="Film.Horizontal.TProgressbar")
        self.progress.grid(row=0, column=1, sticky="ew")

        results = Surface(body, padding=0)
        results.grid(row=3, column=0, sticky="nsew", padx=28)
        results.rowconfigure(0, weight=1)
        results.columnconfigure(0, weight=1)
        columns = ("title", "source", "episodes", "category")
        self.tree = ttk.Treeview(results, columns=columns, show="headings", selectmode="extended", style="Film.Treeview")
        for column, title in (("title", "剧名"), ("source", "来源"), ("episodes", "集数"), ("category", "分类")):
            self.tree.heading(column, text=title)
        self.tree.column("title", width=380, minwidth=200, stretch=True)
        self.tree.column("source", width=160, minwidth=110, stretch=False)
        self.tree.column("episodes", width=100, minwidth=80, stretch=False)
        self.tree.column("category", width=260, minwidth=150, stretch=True)
        self.tree.grid(row=0, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(results, orient="vertical", command=self.tree.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=scrollbar.set)
        self.tree.bind("<<TreeviewSelect>>", lambda _event: on_select())
        self.tree.bind("<Double-1>", lambda _event: on_download())

        detail = Surface(body, padding=(14, 10))
        detail.grid(row=4, column=0, sticky="ew", padx=28, pady=(10, 22))
        detail.columnconfigure(0, weight=1)
        ttk.Label(detail, textvariable=detail_var, style="Muted.Surface.TLabel", wraplength=650).grid(row=0, column=0, sticky="w")
        self.download_button = ttk.Button(detail, text="下载选中", style="Ink.TButton", command=on_download)
        self.download_button.grid(row=0, column=1, padx=(10, 6))
        ttk.Button(detail, text="打开详情", command=on_open).grid(row=0, column=2, padx=6)
        ttk.Button(detail, text="导出", command=on_export).grid(row=0, column=3, padx=6)
        ttk.Button(detail, text="清空", style="Danger.TButton", command=on_clear).grid(row=0, column=4, padx=(6, 0))

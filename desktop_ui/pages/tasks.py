from tkinter import ttk

from .base import BasePage
from ..theme import COLORS
from ..widgets import Surface


class TasksPage(BasePage):
    def __init__(
        self,
        master,
        bulk_var,
        status_var,
        on_add,
        on_start,
        on_pause,
        on_retry,
        on_copy,
        on_export,
        on_clear,
    ):
        super().__init__(master)
        body = self.content
        body.columnconfigure(0, weight=1)
        body.rowconfigure(3, weight=1)

        head = ttk.Frame(body, style="Page.TFrame")
        head.grid(row=0, column=0, sticky="ew", padx=28, pady=(22, 14))
        ttk.Label(head, text="下载队列 / 03", style="PageTitle.TLabel").pack(anchor="w")
        ttk.Label(head, text="识别分享链接或短剧 ID，集中管理下载与合并进度。", style="Muted.TLabel").pack(anchor="w", pady=(4, 0))

        quick_add = Surface(body, padding=16)
        quick_add.grid(row=1, column=0, sticky="ew", padx=28)
        quick_add.columnconfigure(0, weight=1)
        ttk.Label(quick_add, text="快速添加", style="Section.Surface.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(quick_add, text="多个 ID 可用逗号、空格或换行分隔", style="Muted.Surface.TLabel").grid(row=1, column=0, sticky="w", pady=(3, 11))
        self.bulk_entry = ttk.Entry(quick_add, textvariable=bulk_var)
        self.bulk_entry.grid(row=2, column=0, sticky="ew", padx=(0, 10))
        self.add_button = ttk.Button(quick_add, text="识别并添加", style="Ink.TButton", command=on_add)
        self.add_button.grid(row=2, column=1)
        self.bulk_entry.bind("<Return>", lambda _event: on_add())

        actions = ttk.Frame(body, style="Page.TFrame")
        actions.grid(row=2, column=0, sticky="ew", padx=28, pady=(12, 9))
        self.start_button = ttk.Button(actions, text="▶  开始", style="Signal.TButton", command=on_start)
        self.start_button.pack(side="left", padx=(0, 6))
        self.pause_button = ttk.Button(actions, text="Ⅱ  暂停", command=on_pause)
        self.pause_button.pack(side="left", padx=6)
        self.retry_button = ttk.Button(actions, text="↻  重试失败", command=on_retry)
        self.retry_button.pack(side="left", padx=6)
        ttk.Button(actions, text="复制链接", command=on_copy).pack(side="left", padx=6)
        ttk.Button(actions, text="导出", command=on_export).pack(side="left", padx=6)
        self.clear_button = ttk.Button(actions, text="清空", style="Danger.TButton", command=on_clear)
        self.clear_button.pack(side="right")

        table = Surface(body, padding=0)
        table.grid(row=3, column=0, sticky="nsew", padx=28)
        table.rowconfigure(0, weight=1)
        table.columnconfigure(0, weight=1)
        columns = ("title", "status", "progress", "message")
        self.tree = ttk.Treeview(table, columns=columns, show="headings", selectmode="extended", style="Film.Treeview")
        for column, title in (("title", "剧集"), ("status", "状态"), ("progress", "进度"), ("message", "说明")):
            self.tree.heading(column, text=title)
        self.tree.column("title", width=390, minwidth=210, stretch=True)
        self.tree.column("status", width=110, minwidth=90, stretch=False)
        self.tree.column("progress", width=130, minwidth=100, stretch=False)
        self.tree.column("message", width=360, minwidth=180, stretch=True)
        self.tree.grid(row=0, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(table, orient="vertical", command=self.tree.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=scrollbar.set)
        self.tree.bind("<Double-1>", lambda _event: on_copy())
        self.tree.tag_configure("failed", foreground=COLORS["danger"])
        self.tree.tag_configure("active", foreground=COLORS["primary"])
        self.tree.tag_configure("done", foreground=COLORS["muted"])

        footer = ttk.Frame(body, style="Page.TFrame")
        footer.grid(row=4, column=0, sticky="ew", padx=28, pady=(10, 22))
        footer.columnconfigure(1, weight=1)
        ttk.Label(footer, textvariable=status_var, style="Muted.TLabel").grid(row=0, column=0, sticky="w", padx=(0, 14))
        self.progress = ttk.Progressbar(footer, mode="determinate", maximum=1, value=0, style="Film.Horizontal.TProgressbar")
        self.progress.grid(row=0, column=1, sticky="ew")

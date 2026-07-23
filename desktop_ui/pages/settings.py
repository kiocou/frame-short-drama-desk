from tkinter import ttk

from .base import BasePage
from ..widgets import Surface


class SettingsPage(BasePage):
    def __init__(
        self, master, device_var, install_var, platform_var, auto_merge_var,
        output_dir_var, workers_var, status_var, on_choose_output, on_open_output, on_save,
    ):
        super().__init__(master)
        body = self.content
        body.columnconfigure(0, weight=1)

        head = ttk.Frame(body, style="Page.TFrame")
        head.grid(row=0, column=0, sticky="ew", padx=28, pady=(22, 14))
        ttk.Label(head, text="系统设置 / 04", style="PageTitle.TLabel").pack(anchor="w")
        ttk.Label(head, text="管理解析身份、下载位置与并发策略。", style="Muted.TLabel").pack(anchor="w", pady=(4, 0))

        form = Surface(body, padding=22)
        form.grid(row=1, column=0, sticky="ew", padx=28)
        form.columnconfigure(1, weight=1)
        ttk.Label(form, text="解析身份", style="Section.Surface.TLabel").grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 14))
        ttk.Label(form, text="device_id", style="Surface.TLabel").grid(row=1, column=0, sticky="w", padx=(0, 22), pady=7)
        ttk.Entry(form, textvariable=device_var).grid(row=1, column=1, sticky="ew", pady=7)
        ttk.Label(form, text="install_id", style="Surface.TLabel").grid(row=2, column=0, sticky="w", padx=(0, 22), pady=7)
        ttk.Entry(form, textvariable=install_var).grid(row=2, column=1, sticky="ew", pady=7)
        ttk.Label(form, text="运行平台", style="Surface.TLabel").grid(row=3, column=0, sticky="w", padx=(0, 22), pady=7)
        ttk.Combobox(form, textvariable=platform_var, values=["android", "ios"], state="readonly", width=16).grid(row=3, column=1, sticky="w", pady=7)

        ttk.Separator(form).grid(row=4, column=0, columnspan=2, sticky="ew", pady=16)
        ttk.Label(form, text="下载偏好", style="Section.Surface.TLabel").grid(row=5, column=0, columnspan=2, sticky="w", pady=(0, 9))
        ttk.Label(form, text="保存位置", style="Surface.TLabel").grid(row=6, column=0, sticky="w", padx=(0, 22), pady=7)
        path_row = ttk.Frame(form, style="Surface.TFrame")
        path_row.grid(row=6, column=1, sticky="ew", pady=7)
        path_row.columnconfigure(0, weight=1)
        ttk.Entry(path_row, textvariable=output_dir_var, state="readonly").grid(row=0, column=0, sticky="ew", padx=(0, 8))
        ttk.Button(path_row, text="更改", command=on_choose_output).grid(row=0, column=1, padx=(0, 6))
        ttk.Button(path_row, text="打开", command=on_open_output).grid(row=0, column=2)
        ttk.Label(form, text="并发任务", style="Surface.TLabel").grid(row=7, column=0, sticky="w", padx=(0, 22), pady=7)
        ttk.Combobox(form, textvariable=workers_var, values=["2", "4", "6", "8"], state="readonly", width=12).grid(row=7, column=1, sticky="w", pady=7)
        ttk.Checkbutton(form, text="全集完成后自动合并；关闭时保留全部分集", variable=auto_merge_var).grid(row=8, column=1, sticky="w", pady=7)
        ttk.Button(form, text="保存设置", style="Signal.TButton", command=on_save).grid(row=9, column=1, sticky="w", pady=(18, 0))

        status = Surface(body, padding=16)
        status.grid(row=2, column=0, sticky="ew", padx=28, pady=14)
        status.columnconfigure(0, weight=1)
        ttk.Label(status, text="配置状态", style="Section.Surface.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(status, textvariable=status_var, style="Muted.Surface.TLabel", wraplength=800).grid(row=1, column=0, sticky="w", pady=(6, 0))

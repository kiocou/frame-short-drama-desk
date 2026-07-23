"""短剧下载神器桌面版：Tkinter native GUI, no browser server."""
import csv
import json
import os
import queue
import threading
import time
import webbrowser
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from pathlib import Path
from tkinter import END, LEFT, RIGHT, X, BooleanVar, StringVar, Tk, messagebox, filedialog
from tkinter import ttk

import app as backend
import desktop_downloads as downloads
import desktop_state
from desktop_ui.motion import animate_progress
from desktop_ui.pages import HomePage, SearchPage, SettingsPage, TasksPage
from desktop_ui.theme import apply_theme
from desktop_ui.widgets import NavRail


APP_TITLE = "FRAME · 短剧工作台"
TASK_STORE = "desktop_tasks.json"


class DesktopApp:
    def __init__(self, root: Tk):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("1320x820")
        self.root.minsize(1120, 700)

        self.search_rows = []
        self.tasks = []
        self.ui_events = queue.Queue()
        self._task_render_pending = False
        self._search_render_pending = False
        self.running = False
        self.pause_requested = False
        initial_config = backend.read_local_config()
        try:
            configured_workers = int(initial_config.get("download_workers", 4) or 4)
        except (TypeError, ValueError):
            configured_workers = 4
        self.download_workers = min(8, max(2, configured_workers))
        self.task_lock = threading.RLock()
        self.queue_wakeup = threading.Event()
        self.searching = False
        self.current_page = "home"
        self.task_store_warning = ""
        configured_output = str(initial_config.get("download_dir") or "").strip()
        self.download_root = (
            Path(os.path.expandvars(configured_output)).expanduser().resolve()
            if configured_output else downloads.default_output_root()
        )
        os.environ["DUANJU_DOWNLOAD_DIR"] = str(self.download_root)

        self.keyword_var = StringVar(value="穿越")
        self.page_var = StringVar(value="1")
        self.source_var = StringVar(value="红果短剧")
        self.category_var = StringVar(value="穿越")
        self.bulk_var = StringVar()
        self.search_detail_var = StringVar(value="选择一条结果可查看完整 ID 与来源")
        self.search_status = StringVar(value="输入关键词开始搜索")
        self.task_status = StringVar(value="等待任务")
        self.config_status = StringVar(value="")
        self.header_status = StringVar(value="● 运行正常")
        self.notice_var = StringVar(value="")

        self.device_var = StringVar()
        self.install_var = StringVar()
        self.platform_var = StringVar(value="android")
        self.auto_merge_var = BooleanVar(value=True)
        self.output_dir_var = StringVar(value=str(self.download_root))
        self.workers_var = StringVar(value=str(self.download_workers))
        self.auto_merge_enabled = True

        self._build_ui()
        self._load_config_status()
        self._load_tasks()
        self._render_tasks()
        self.root.after(40, self._drain_ui_events)

    def _post_ui(self, callback, *args):
        """Queue UI work; worker threads never touch Tk widgets directly."""
        self.ui_events.put((callback, args))

    def _drain_ui_events(self):
        processed = 0
        while processed < 16:
            try:
                callback, args = self.ui_events.get_nowait()
            except queue.Empty:
                break
            try:
                callback(*args)
            except Exception as exc:
                print(f"[desktop][ui] {exc}")
            processed += 1
        self.root.after(40, self._drain_ui_events)

    def _request_task_render(self):
        self._post_ui(self._schedule_task_render)

    def _schedule_task_render(self):
        if self._task_render_pending:
            return
        self._task_render_pending = True
        self.root.after(100, self._render_tasks)

    def _schedule_search_render(self, items):
        self._pending_search_rows = items
        if self._search_render_pending:
            return
        self._search_render_pending = True
        self.root.after(80, self._render_search_rows)

    # ───────────────────────── UI ─────────────────────────
    def _apply_theme(self):
        self.style = apply_theme(self.root)

    def _build_ui(self):
        self._apply_theme()
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)

        shell = ttk.Frame(self.root, style="Page.TFrame")
        shell.grid(row=0, column=0, sticky="nsew")
        shell.columnconfigure(1, weight=1)
        shell.rowconfigure(0, weight=1)

        self.nav = NavRail(shell, self.show_page)
        self.nav.grid(row=0, column=0, sticky="ns")

        main = ttk.Frame(shell, style="Page.TFrame")
        main.grid(row=0, column=1, sticky="nsew")
        main.columnconfigure(0, weight=1)
        main.rowconfigure(1, weight=1)

        header = ttk.Frame(main, style="Header.TFrame", padding=(24, 12))
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(0, weight=1)
        brand = ttk.Frame(header, style="Header.TFrame")
        brand.grid(row=0, column=0, sticky="w")
        ttk.Label(brand, text="FRAME / DESK", style="Title.TLabel").pack(anchor="w")
        ttk.Label(brand, text="解析 · 下载 · 快速成片", style="Muted.Surface.TLabel").pack(anchor="w")
        self.notice_label = ttk.Label(header, textvariable=self.notice_var, style="Warning.TLabel")
        self.notice_label.grid(row=0, column=1, padx=18)
        self.notice_label.grid_remove()
        ttk.Label(header, textvariable=self.header_status, style="Status.TLabel").grid(row=0, column=2, sticky="e")

        page_host = ttk.Frame(main, style="Page.TFrame")
        page_host.grid(row=1, column=0, sticky="nsew")
        page_host.columnconfigure(0, weight=1)
        page_host.rowconfigure(0, weight=1)

        self.home_page = HomePage(
            page_host,
            self.keyword_var,
            self.bulk_var,
            self._start_search_from_home,
            self._add_bulk_from_home,
            lambda: self.show_page("tasks"),
        )
        self.search_page = SearchPage(
            page_host,
            self.keyword_var,
            self.page_var,
            self.source_var,
            self.category_var,
            self.search_detail_var,
            self.search_status,
            self.start_search,
            self.add_selected_to_tasks,
            self.open_selected_source_url,
            self.export_search_csv,
            self.clear_search_rows,
            self._update_search_detail,
        )
        self.tasks_page = TasksPage(
            page_host,
            self.bulk_var,
            self.task_status,
            self.add_bulk_to_tasks,
            self.start_download_queue,
            self.pause_queue,
            self.retry_selected_tasks,
            self.copy_selected_task_url,
            self.export_tasks_csv,
            self.clear_tasks,
        )
        self.settings_page = SettingsPage(
            page_host,
            self.device_var,
            self.install_var,
            self.platform_var,
            self.auto_merge_var,
            self.output_dir_var,
            self.workers_var,
            self.config_status,
            self.choose_output_dir,
            self.open_output_dir,
            self.save_config,
        )
        self.pages = {
            "home": self.home_page,
            "search": self.search_page,
            "tasks": self.tasks_page,
            "settings": self.settings_page,
        }
        for page in self.pages.values():
            page.grid(row=0, column=0, sticky="nsew")

        # Compatibility aliases keep the backend-oriented controller methods small.
        self.search_tab = self.search_page
        self.download_tab = self.tasks_page
        self.setting_tab = self.settings_page
        self.search_tree = self.search_page.tree
        self.search_progress = self.search_page.progress
        self.search_button = self.search_page.search_button
        self.download_selected_button = self.search_page.download_button
        self.task_tree = self.tasks_page.tree
        self.download_progress = self.tasks_page.progress
        self.add_bulk_button = self.tasks_page.add_button
        self.start_download_button = self.tasks_page.start_button
        self.pause_button = self.tasks_page.pause_button
        self.clear_tasks_button = self.tasks_page.clear_button
        self.home_search_button = self.home_page.search_button
        self.home_bulk_button = self.home_page.bulk_button
        self.show_page("home", animate=False)

    def show_page(self, name: str, animate: bool = True):
        page = self.pages.get(name)
        if page is None:
            return
        self.current_page = name
        page.tkraise()
        self.nav.set_active(name, animate=animate)
        if animate:
            page.reveal()

    def _start_search_from_home(self):
        self.show_page("search")
        self.start_search()

    def _add_bulk_from_home(self):
        self.show_page("tasks")
        self.add_bulk_to_tasks()

    def _set_notice(self, message: str):
        self.notice_var.set(message)
        if message:
            self.notice_label.grid()
        else:
            self.notice_label.grid_remove()

    def _update_search_detail(self):
        items = self.selected_search_items()
        if not items:
            self.search_detail_var.set("选择一条结果可查看完整 ID 与来源")
            return
        item = items[0]
        drama_id = item.get("drama_id") or "无公开 ID"
        source_url = item.get("source_url") or "无公开链接"
        self.search_detail_var.set(f"ID：{drama_id}    来源：{source_url}")

    def _build_search_tab(self):
        tab = self.search_tab
        tab.rowconfigure(2, weight=1)
        tab.columnconfigure(0, weight=1)

        bar = ttk.LabelFrame(tab, text="搜索筛选区", padding=10)
        bar.grid(row=0, column=0, sticky="ew", padx=8, pady=8)
        for i in range(10):
            bar.columnconfigure(i, weight=0)
        bar.columnconfigure(1, weight=1)

        ttk.Label(bar, text="搜索关键词").grid(row=0, column=0, sticky="w", padx=(0, 6))
        ttk.Entry(bar, textvariable=self.keyword_var, width=30).grid(row=0, column=1, sticky="ew", padx=(0, 10))
        ttk.Label(bar, text="页码").grid(row=0, column=2, sticky="w")
        ttk.Entry(bar, textvariable=self.page_var, width=8).grid(row=0, column=3, padx=(4, 10))
        ttk.Label(bar, text="数据来源").grid(row=0, column=4, sticky="w")
        ttk.Combobox(
            bar,
            textvariable=self.source_var,
            values=["红果短剧", "红果漫剧", "爱奇艺短剧", "FlexTV", "熊猫短剧", "趣看看短剧", "全网聚合"],
            width=16,
            state="readonly",
        ).grid(row=0, column=5, padx=(4, 10))
        self.search_button = ttk.Button(bar, text="开始搜索", command=self.start_search)
        self.search_button.grid(row=0, column=6, padx=4)
        self.download_selected_button = ttk.Button(bar, text="下载选中", command=self.add_selected_to_tasks)
        self.download_selected_button.grid(row=0, column=7, padx=4)
        ttk.Button(bar, text="导出数据", command=self.export_search_csv).grid(row=0, column=8, padx=4)

        ttk.Label(bar, text="分类过滤").grid(row=1, column=0, sticky="w", pady=(10, 0))
        ttk.Entry(bar, textvariable=self.category_var).grid(row=1, column=1, columnspan=5, sticky="ew", pady=(10, 0), padx=(0, 10))
        ttk.Button(bar, text="清空列表", command=self.clear_search_rows).grid(row=1, column=6, pady=(10, 0), padx=4)
        ttk.Button(bar, text="打开详情", command=self.open_selected_source_url).grid(row=1, column=7, pady=(10, 0), padx=4)

        status_row = ttk.Frame(tab, padding=(10, 2))
        status_row.grid(row=1, column=0, sticky="ew")
        status_row.columnconfigure(1, weight=1)
        self.search_status = StringVar(value="输入关键词开始搜索")
        ttk.Label(status_row, textvariable=self.search_status, foreground="#52717b").grid(row=0, column=0, sticky="w", padx=(0, 12))
        self.search_progress = ttk.Progressbar(status_row, mode="determinate", maximum=100, value=0, bootstyle="success-striped")
        self.search_progress.grid(row=0, column=1, sticky="ew")

        columns = ("idx", "author", "title", "drama_id", "episodes", "duration", "online_time", "category", "source", "source_url")
        self.search_tree = ttk.Treeview(tab, columns=columns, show="headings", selectmode="extended")
        headings = {
            "idx": "序号", "author": "作者", "title": "剧名", "drama_id": "短剧ID", "episodes": "集数",
            "duration": "时长", "online_time": "上线时间", "category": "分类", "source": "来源", "source_url": "详情链接",
        }
        widths = {"idx": 55, "author": 110, "title": 230, "drama_id": 170, "episodes": 80, "duration": 220, "online_time": 110, "category": 170, "source": 120, "source_url": 280}
        for c in columns:
            self.search_tree.heading(c, text=headings[c])
            self.search_tree.column(c, width=widths[c], anchor="w", stretch=False)
        self.search_tree.grid(row=2, column=0, sticky="nsew", padx=8, pady=8)
        self.search_tree.bind("<Double-1>", lambda e: self.add_selected_to_tasks())
        yscroll = ttk.Scrollbar(tab, orient="vertical", command=self.search_tree.yview)
        self.search_tree.configure(yscrollcommand=yscroll.set)
        yscroll.grid(row=2, column=1, sticky="ns", pady=8)

    def _build_download_tab(self):
        tab = self.download_tab
        tab.rowconfigure(1, weight=1)
        tab.columnconfigure(0, weight=1)

        top = ttk.LabelFrame(tab, text="批量下载", padding=10)
        top.grid(row=0, column=0, sticky="ew", padx=8, pady=8)
        top.columnconfigure(0, weight=1)
        self.bulk_text = ttk.Entry(top)
        self.bulk_text.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.bulk_text.insert(0, "粘贴短剧ID，多个用逗号或空格分隔")
        self.add_bulk_button = ttk.Button(top, text="识别并下载", command=self.add_bulk_to_tasks)
        self.add_bulk_button.grid(row=0, column=1, padx=4)
        self.start_download_button = ttk.Button(top, text="开始下载", command=self.start_download_queue)
        self.start_download_button.grid(row=0, column=2, padx=4)
        self.pause_button = ttk.Button(top, text="暂停", command=self.pause_queue)
        self.pause_button.grid(row=0, column=3, padx=4)
        ttk.Button(top, text="导出下载链接", command=self.export_tasks_csv).grid(row=0, column=4, padx=4)
        self.clear_tasks_button = ttk.Button(top, text="清空任务", command=self.clear_tasks)
        self.clear_tasks_button.grid(row=0, column=5, padx=4)
        ttk.Button(top, text="复制选中链接", command=self.copy_selected_task_url).grid(row=0, column=6, padx=4)

        columns = ("idx", "title", "id", "status", "url", "msg")
        self.task_tree = ttk.Treeview(tab, columns=columns, show="headings", selectmode="extended")
        headings = {"idx": "序号", "title": "剧名", "id": "短剧ID", "status": "状态", "url": "下载链接", "msg": "说明"}
        widths = {"idx": 55, "title": 260, "id": 180, "status": 90, "url": 360, "msg": 300}
        for c in columns:
            self.task_tree.heading(c, text=headings[c])
            self.task_tree.column(c, width=widths[c], anchor="w", stretch=False)
        self.task_tree.grid(row=1, column=0, sticky="nsew", padx=8, pady=8)
        self.task_tree.bind("<Double-1>", lambda e: self.copy_selected_task_url())
        yscroll = ttk.Scrollbar(tab, orient="vertical", command=self.task_tree.yview)
        self.task_tree.configure(yscrollcommand=yscroll.set)
        yscroll.grid(row=1, column=1, sticky="ns", pady=8)

        self.task_status = StringVar(value="等待任务")
        footer = ttk.Frame(tab, padding=(10, 4))
        footer.grid(row=2, column=0, sticky="ew")
        footer.columnconfigure(1, weight=1)
        ttk.Label(footer, textvariable=self.task_status, foreground="#52717b").grid(row=0, column=0, sticky="w", padx=(0, 12))
        self.download_progress = ttk.Progressbar(footer, mode="determinate", bootstyle="success-striped")
        self.download_progress.grid(row=0, column=1, sticky="ew")

    def _build_setting_tab(self):
        tab = self.setting_tab
        frm = ttk.LabelFrame(tab, text="本机配置", padding=16)
        frm.pack(fill=X, padx=12, pady=12)
        frm.columnconfigure(1, weight=1)

        ttk.Label(frm, text="device_id").grid(row=0, column=0, sticky="w", pady=6)
        ttk.Entry(frm, textvariable=self.device_var).grid(row=0, column=1, sticky="ew", pady=6)
        ttk.Label(frm, text="install_id").grid(row=1, column=0, sticky="w", pady=6)
        ttk.Entry(frm, textvariable=self.install_var).grid(row=1, column=1, sticky="ew", pady=6)
        ttk.Label(frm, text="platform").grid(row=2, column=0, sticky="w", pady=6)
        ttk.Combobox(frm, textvariable=self.platform_var, values=["android", "ios"], state="readonly", width=12).grid(row=2, column=1, sticky="w", pady=6)
        ttk.Checkbutton(
            frm,
            text="全集下载完成后自动合并（关闭时保留全部分集）",
            variable=self.auto_merge_var,
            bootstyle="success-round-toggle",
        ).grid(row=3, column=1, sticky="w", pady=8)
        ttk.Button(frm, text="保存配置", command=self.save_config).grid(row=4, column=1, sticky="w", pady=12)

        self.config_status = StringVar(value="")
        ttk.Label(tab, textvariable=self.config_status, foreground="#666").pack(fill=X, padx=16)

    # ───────────────────────── 搜索 ─────────────────────────
    def _set_search_busy(self, busy: bool):
        state = "disabled" if busy else "normal"
        text = "搜索中…" if busy else "开始搜索"
        self.search_button.configure(state=state, text=text)
        self.home_search_button.configure(state=state, text=text)

    def start_search(self):
        if self.searching:
            return
        self.searching = True
        self.search_started_at = time.perf_counter()
        self.search_status.set("正在并发查询公开来源...")
        self.search_progress.configure(mode="determinate", maximum=100, value=2)
        self._set_notice("")
        self._set_search_busy(True)
        try:
            page = max(int(self.page_var.get() or "1"), 1)
        except ValueError:
            page = 1
        params = (
            self.keyword_var.get().strip(), page, self.source_var.get().strip(),
            self.category_var.get().strip(),
        )
        threading.Thread(target=self._search_worker, args=params, daemon=True).start()

    def _search_worker(self, keyword, page, source, category):
        try:
            def progress(percent):
                self._post_ui(self._update_search_progress, percent)
            items = backend.search_short_drama(keyword, page, source, category, progress)
            self._post_ui(self._set_search_rows, items)
        except Exception as exc:
            self._post_ui(self._show_search_error, str(exc))

    def _show_search_error(self, message):
        self.searching = False
        animate_progress(self.search_progress, 0, 100)
        self._set_search_busy(False)
        self.search_status.set(f"搜索失败 · {message}")
        self._set_notice("搜索失败，可修改条件后重试")

    def _update_search_progress(self, percent):
        value = max(0, min(100, float(percent)))
        animate_progress(self.search_progress, value, 100)
        if self.searching:
            self.search_status.set(f"搜索中… {value:.0f}%")

    def _set_search_rows(self, items):
        self.search_rows = list(items or [])
        self._schedule_search_render(self.search_rows)

    def _render_search_rows(self):
        self._search_render_pending = False
        self.searching = False
        animate_progress(self.search_progress, 100, 100)
        self._set_search_busy(False)
        items = self._pending_search_rows
        existing = set(self.search_tree.get_children())
        for i, item in enumerate(items, 1):
            iid = str(i - 1)
            values = (
                item.get("title", ""),
                item.get("source") or item.get("author") or "",
                item.get("episodes", ""),
                item.get("category", ""),
            )
            if iid in existing:
                self.search_tree.item(iid, values=values)
                existing.remove(iid)
            else:
                self.search_tree.insert("", END, iid=iid, values=values)
        if existing:
            self.search_tree.delete(*existing)
        elapsed = time.perf_counter() - getattr(self, "search_started_at", time.perf_counter())
        self.search_status.set(f"搜索完成 · {len(items)} 条 · {elapsed:.1f} 秒")
        self.search_detail_var.set("选择一条结果可查看完整 ID 与来源" if items else "没有找到结果，请尝试更换关键词或来源")

    def selected_search_items(self):
        out = []
        for iid in self.search_tree.selection():
            idx = int(iid)
            if 0 <= idx < len(self.search_rows):
                out.append(self.search_rows[idx])
        return out

    def clear_search_rows(self):
        self.search_rows = []
        self.search_tree.delete(*self.search_tree.get_children())
        self.search_status.set("已清空")
        self.search_detail_var.set("选择一条结果可查看完整 ID 与来源")

    def open_selected_source_url(self):
        items = self.selected_search_items()
        if not items:
            messagebox.showinfo("提示", "请先选择一条结果")
            return
        url = items[0].get("source_url")
        if url:
            webbrowser.open(url)

    # ───────────────────────── 任务 ─────────────────────────
    def add_selected_to_tasks(self):
        items = self.selected_search_items()
        if not items:
            messagebox.showinfo("提示", "请先选择搜索结果")
            return
        self.search_status.set("正在解析所选短剧全集...")
        self.search_progress.start(12)
        self.download_selected_button.configure(state="disabled", text="解析中…")
        threading.Thread(target=self._add_selected_worker, args=(items,), daemon=True).start()

    def _enqueue_series(self, series_id, title, ids, source_url=""):
        added = 0
        with self.task_lock:
            known_ids = {str(task.get("id")) for task in self.tasks}
            for episode, video_id in enumerate(ids, 1):
                video_id = str(video_id)
                if video_id in known_ids:
                    continue
                episode_title = f"{title} 第{episode}集" if len(ids) > 1 else title
                self.tasks.append({"title": episode_title, "series_title": title, "episode": episode, "episode_total": len(ids), "id": video_id, "series_id": series_id, "source_url": source_url, "status": "等待", "url": "", "local_path": "", "merge_status": "等待全集", "merge_progress": 0.0, "msg": "等待下载"})
                known_ids.add(video_id)
                added += 1
        if added:
            self.queue_wakeup.set()
        return added

    def _add_selected_worker(self, items):
        added, skipped = 0, 0
        for item in items:
            did = str(item.get("drama_id") or "").strip()
            if not did or item.get("downloadable") is False:
                skipped += 1
                continue
            ids = [did]
            if item.get("id_type") == "series_id" or "hongguoduanju.com/detail" in str(item.get("source_url") or ""):
                try:
                    ids = backend.resolve_hongguo_episode_ids(did, str(item.get("source_url") or "")) or []
                except Exception:
                    ids = []
            if not ids:
                skipped += 1
                continue
            added += self._enqueue_series(did, item.get("title") or did, ids, str(item.get("source_url") or ""))
        self._save_tasks()
        self._post_ui(self._finish_add_selected, added, skipped)

    def _finish_add_selected(self, added, skipped):
        self.search_progress.stop()
        self.download_selected_button.configure(state="normal", text="下载选中")
        self.search_status.set(f"已加入 {added} 集" + (f" · 跳过 {skipped} 项" if skipped else ""))
        self._render_tasks()
        self.show_page("tasks")
        if added:
            self.start_download_queue()

    def add_bulk_to_tasks(self):
        raw = self.bulk_var.get().strip()
        if not raw:
            self.task_status.set("请先粘贴分享链接或短剧 ID")
            return
        self.task_status.set("正在识别分享链接...")
        self.add_bulk_button.configure(state="disabled", text="识别中…")
        self.home_bulk_button.configure(state="disabled", text="识别中…")
        threading.Thread(target=self._add_bulk_worker, args=(raw,), daemon=True).start()

    def _add_bulk_worker(self, raw):
        share_urls = backend.extract_novelquickapp_urls(raw)
        remaining = raw
        added = 0
        errors = []
        for url in share_urls:
            remaining = remaining.replace(url, " ")
            try:
                info = backend.resolve_novelquickapp_share(url)
                added += self._enqueue_series(info["series_id"], info["title"], info["episode_ids"], url)
            except Exception as exc:
                errors.append(f"{url}: {exc}")
        ids = [x.strip() for x in remaining.replace("，", ",").replace(";", ",").replace("；", ",").replace("\n", ",").replace(" ", ",").split(",") if x.strip()]
        ids = [value for value in ids if value.isdigit()]
        with self.task_lock:
            known_ids = {str(task.get("id")) for task in self.tasks}
            for did in ids:
                if did in known_ids:
                    continue
                self.tasks.append({"title": did, "id": did, "status": "等待", "url": "", "msg": "等待下载"})
                known_ids.add(did)
                added += 1
        if added:
            self.queue_wakeup.set()
        self._save_tasks()
        self._post_ui(self._finish_add_bulk, added, len(errors))

    def _finish_add_bulk(self, added, error_count):
        self.add_bulk_button.configure(state="normal", text="识别并添加")
        self.home_bulk_button.configure(state="normal", text="识别任务")
        if added:
            self.bulk_var.set("")
        self._render_tasks()
        self.task_status.set(f"识别完成 · 已加入 {added} 集" + (f" · 失败 {error_count}" if error_count else ""))
        if added:
            self.start_download_queue()

    def start_download_queue(self):
        if self.running:
            self.queue_wakeup.set()
            return
        with self.task_lock:
            has_waiting = any(task.get("status") == "等待" for task in self.tasks)
        has_merge_work = bool(self._merge_candidates()) if self.auto_merge_enabled else False
        if not has_waiting and not has_merge_work:
            failed = sum(1 for task in self.tasks if task.get("status") == "失败")
            self.task_status.set("没有等待任务" + (f" · {failed} 项失败可重试" if failed else ""))
            return
        self.running = True
        self.pause_requested = False
        self.start_download_button.configure(state="disabled", text="下载中…")
        self.clear_tasks_button.configure(state="disabled")
        self.header_status.set("● 正在下载")
        threading.Thread(target=self._download_worker, daemon=True).start()

    def _download_worker(self):
        active = set()
        with ThreadPoolExecutor(max_workers=self.download_workers, thread_name_prefix="episode") as pool:
            while True:
                if not self.pause_requested:
                    with self.task_lock:
                        claimed = desktop_state.claim_waiting_tasks(self.tasks, self.download_workers - len(active))
                    for task in claimed:
                        active.add(pool.submit(self._download_one, task))
                if active:
                    finished, active = wait(active, timeout=0.2, return_when=FIRST_COMPLETED)
                    for future in finished:
                        try:
                            future.result()
                        except Exception as exc:
                            print(f"[desktop][download] {exc}")
                    if finished:
                        self._save_tasks()
                        self._request_task_render()
                    continue
                if self.pause_requested:
                    break
                self.queue_wakeup.clear()
                with self.task_lock:
                    if any(task.get("status") == "等待" for task in self.tasks):
                        continue
                if self.queue_wakeup.wait(0.2):
                    continue
                with self.task_lock:
                    if any(task.get("status") == "等待" for task in self.tasks):
                        continue
                break

        # Merge each completed series once all concurrent episode jobs settle.
        if not self.pause_requested and self.auto_merge_enabled:
            for series_id in self._merge_candidates():
                self._merge_completed_series(series_id)
        self.running = False
        self._save_tasks()
        self._post_ui(self._finish_download_cycle)

    def _merge_candidates(self):
        with self.task_lock:
            series_ids = list(dict.fromkeys(str(task.get("series_id") or "") for task in self.tasks))
            snapshot = list(self.tasks)
        candidates = []
        for series_id in series_ids:
            if not series_id:
                continue
            series_tasks = [task for task in snapshot if str(task.get("series_id") or "") == series_id]
            if series_tasks and all(task.get("merge_status") == "已合并" for task in series_tasks):
                continue
            if downloads.series_ready(snapshot, series_id):
                candidates.append(series_id)
        return candidates

    def _finish_download_cycle(self):
        self.start_download_button.configure(state="normal", text="开始下载")
        self.clear_tasks_button.configure(state="normal")
        self.header_status.set("● 已暂停" if self.pause_requested else "● 运行正常")
        self._render_tasks()

    def _download_one(self, task):
        with self.task_lock:
            task["status"] = "下载中"
            task["msg"] = "正在解析并下载..."
        self._request_task_render()
        try:
            result = backend.handle_video_request(task["id"], None, max_retries=3)
            local_path = downloads.local_path_from_result(
                result, backend.parser_module.get_runtime_base_dir(), self.download_root,
            )
            if local_path is None:
                raise RuntimeError("分集视频未保存到本地")
            with self.task_lock:
                task["url"] = result.get("url") or result.get("download_url") or ""
                task["local_path"] = str(local_path or "")
                task["status"] = "完成"
                task["msg"] = "完成" if task["url"] else "解析完成但未返回链接"
        except Exception as exc:
            with self.task_lock:
                task["status"] = "失败"
                task["msg"] = str(exc)
        self._request_task_render()

    def _merge_completed_series(self, series_id):
        try:
            with self.task_lock:
                for item in self.tasks:
                    if str(item.get("series_id")) == series_id:
                        item["merge_status"] = "正在合并"
            self._request_task_render()
            ffprobe = backend.RESOURCE_DIR / "插件" / "ffprobe.exe"
            last_progress_update = [0.0]
            def merge_progress(percent):
                with self.task_lock:
                    for entry in self.tasks:
                        if str(entry.get("series_id")) == series_id:
                            entry["merge_progress"] = percent
                now = time.monotonic()
                if percent < 100 and now - last_progress_update[0] < 0.25:
                    return
                last_progress_update[0] = now
                self._post_ui(self._set_merge_progress_ui, percent)
            output = downloads.merge_series(
                self.tasks, series_id, self.download_root,
                backend.parser_module.get_ffmpeg_binary(),
                str(ffprobe) if ffprobe.exists() else None, merge_progress,
            )
            with self.task_lock:
                desktop_state.complete_series_merge(self.tasks, series_id, output)
                self._save_tasks()
        except Exception as exc:
            with self.task_lock:
                for item in self.tasks:
                    if str(item.get("series_id")) == series_id:
                        item["merge_status"] = "合并失败"
                        item["msg"] = f"合并失败：{exc}"
                self._save_tasks()
            self._request_task_render()

    def _set_merge_progress_ui(self, percent):
        """Update only lightweight widgets; rebuilding the task table stalls Tk."""
        animate_progress(self.download_progress, percent, 100)
        self.task_status.set(f"正在合并全集 · {percent:.1f}%")

    def pause_queue(self):
        self.pause_requested = True
        self.task_status.set("已请求暂停，当前任务结束后停止")

    def clear_tasks(self):
        if self.running:
            self.task_status.set("下载进行中，请先暂停并等待当前任务结束")
            return
        if messagebox.askyesno("确认", "确定清空所有下载任务和已保存链接？"):
            with self.task_lock:
                self.tasks = []
            self._save_tasks()
            self._render_tasks()

    def retry_selected_tasks(self):
        selection = self.task_tree.selection()
        indexes = {int(iid) for iid in selection} if selection else set(range(len(self.tasks)))
        retried = 0
        with self.task_lock:
            for index, task in enumerate(self.tasks):
                if index in indexes and task.get("status") == "失败":
                    task["status"] = "等待"
                    task["msg"] = "等待重试"
                    retried += 1
        if not retried:
            self.task_status.set("没有可重试的失败任务")
            return
        self.queue_wakeup.set()
        self._save_tasks()
        self._render_tasks()
        self.task_status.set(f"已重新加入 {retried} 个失败任务")
        self.start_download_queue()

    def _render_tasks(self):
        self._task_render_pending = False
        existing = set(self.task_tree.get_children())
        for i, t in enumerate(self.tasks, 1):
            iid = str(i - 1)
            status = t.get("status", "")
            if t.get("merge_status") == "正在合并":
                progress_text = f"合并 {float(t.get('merge_progress', 0)):.0f}%"
            elif t.get("merge_status") == "已合并":
                progress_text = "全集已合并"
            elif t.get("episode_total"):
                progress_text = f"第 {t.get('episode', 1)} / {t.get('episode_total')} 集"
            else:
                progress_text = "100%" if status == "完成" else "—"
            values = (t.get("title", ""), status, progress_text, t.get("msg", ""))
            tag = "failed" if status == "失败" else "active" if status in {"排队中", "下载中"} else "done" if status == "完成" else ""
            if iid in existing:
                self.task_tree.item(iid, values=values, tags=(tag,) if tag else ())
                existing.remove(iid)
            else:
                self.task_tree.insert("", END, iid=iid, values=values, tags=(tag,) if tag else ())
        if existing:
            self.task_tree.delete(*existing)
        done = sum(1 for t in self.tasks if t.get("status") == "完成")
        fail = sum(1 for t in self.tasks if t.get("status") == "失败")
        active = sum(1 for t in self.tasks if t.get("status") in {"排队中", "下载中"})
        total = len(self.tasks)
        merging_items = [t for t in self.tasks if t.get("merge_status") == "正在合并"]
        if merging_items:
            percent = max(float(t.get("merge_progress", 0)) for t in merging_items)
            animate_progress(self.download_progress, percent, 100)
            self.task_status.set(f"正在合并全集 · {percent:.1f}%")
        else:
            animate_progress(self.download_progress, done, max(total, 1))
            self.task_status.set(f"分集 {done}/{total} · 下载中 {active} · 失败 {fail}")
        self.home_page.render_tasks(self.tasks)

    def copy_selected_task_url(self):
        sel = self.task_tree.selection()
        if not sel:
            messagebox.showinfo("提示", "请先选择任务")
            return
        urls = []
        for iid in sel:
            idx = int(iid)
            if 0 <= idx < len(self.tasks) and self.tasks[idx].get("url"):
                urls.append(self.tasks[idx]["url"])
        if not urls:
            messagebox.showinfo("提示", "选中任务还没有下载链接")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append("\n".join(urls))
        messagebox.showinfo("复制成功", f"已复制 {len(urls)} 条下载链接")

    # ───────────────────────── 配置/导出 ─────────────────────────
    def _task_store_path(self) -> Path:
        return backend.parser_module.get_runtime_base_dir() / TASK_STORE

    def _load_tasks(self):
        path = self._task_store_path()
        self.tasks, warning = desktop_state.load_task_records(path)
        self.task_store_warning = warning
        if warning:
            print(f"[desktop] {warning}")
            self._set_notice(warning)

    def _save_tasks(self):
        try:
            with self.task_lock:
                downloads.save_tasks(self._task_store_path(), self.tasks)
        except Exception:
            pass

    def _load_config_status(self):
        cfg = backend.read_local_config()
        self.platform_var.set(str(cfg.get("platform") or "android"))
        self.auto_merge_enabled = bool(cfg.get("auto_merge", True))
        self.auto_merge_var.set(self.auto_merge_enabled)
        self.output_dir_var.set(str(self.download_root))
        self.workers_var.set(str(self.download_workers))
        configured = bool((os.getenv("DUANJU_DEVICE_ID") or cfg.get("device_id")) and (os.getenv("DUANJU_INSTALL_ID") or cfg.get("install_id")))
        self.config_status.set(
            f"解析身份：{'已配置' if configured else '未配置'}  ·  输出：{self.download_root}  ·  并发：{self.download_workers}"
        )

    def choose_output_dir(self):
        selected = filedialog.askdirectory(title="选择下载保存位置", initialdir=str(self.download_root))
        if selected:
            self.output_dir_var.set(str(Path(selected).resolve()))

    def open_output_dir(self):
        target = Path(self.output_dir_var.get() or self.download_root).expanduser().resolve()
        try:
            target.mkdir(parents=True, exist_ok=True)
            os.startfile(target)
        except Exception as exc:
            messagebox.showerror("无法打开目录", str(exc))

    def save_config(self):
        existing = backend.read_local_config()
        device_id = self.device_var.get().strip() or str(existing.get("device_id") or "")
        install_id = self.install_var.get().strip() or str(existing.get("install_id") or "")
        if not device_id or not install_id:
            messagebox.showwarning("缺少配置", "请填写 device_id 和 install_id")
            return
        self.auto_merge_enabled = bool(self.auto_merge_var.get())
        output_root = Path(self.output_dir_var.get() or downloads.default_output_root()).expanduser().resolve()
        try:
            workers = min(8, max(2, int(self.workers_var.get() or "4")))
        except ValueError:
            workers = 4
        self.download_root = output_root
        self.download_workers = workers
        os.environ["DUANJU_DOWNLOAD_DIR"] = str(output_root)
        backend.get_config_path().write_text(json.dumps({
            "device_id": device_id,
            "install_id": install_id,
            "platform": self.platform_var.get() or "android",
            "auto_merge": self.auto_merge_enabled,
            "download_dir": str(output_root),
            "download_workers": workers,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        self.device_var.set("")
        self.install_var.set("")
        self._load_config_status()
        messagebox.showinfo("保存成功", "配置已保存")

    def export_search_csv(self):
        if not self.search_rows:
            messagebox.showinfo("提示", "没有搜索结果可导出")
            return
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV 文件", "*.csv")], initialfile="短剧搜索结果_含链接.csv")
        if not path:
            return
        fields = ["author", "title", "drama_id", "episodes", "duration", "online_time", "category", "source", "source_url", "downloadable"]
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for row in self.search_rows:
                w.writerow({k: row.get(k, "") for k in fields})
        messagebox.showinfo("导出成功", path)

    def export_tasks_csv(self):
        if not self.tasks:
            messagebox.showinfo("提示", "没有任务可导出")
            return
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV 文件", "*.csv")], initialfile="短剧下载链接.csv")
        if not path:
            return
        fields = ["title", "id", "status", "url", "msg"]
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for row in self.tasks:
                w.writerow({k: row.get(k, "") for k in fields})
        messagebox.showinfo("导出成功", path)


def main():
    root = Tk()
    DesktopApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()

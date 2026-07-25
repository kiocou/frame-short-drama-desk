import unittest
import tempfile
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest import mock

import app
import desktop_app
import desktop_downloads
import desktop_state
import tauri_bridge
import tkinter as tk


class AppSmokeTests(unittest.TestCase):
    def test_ffmpeg_resolves_from_bundled_plugin_directory(self):
        parser = app.parser_module
        with tempfile.TemporaryDirectory() as tmp:
            runtime_dir = Path(tmp)
            bundled = runtime_dir / "插件" / "ffmpeg.exe"
            bundled.parent.mkdir()
            bundled.write_bytes(b"ffmpeg")

            with mock.patch.object(parser, "get_runtime_base_dir", return_value=runtime_dir):
                self.assertEqual(parser.get_ffmpeg_binary(), str(bundled))

    def test_video_download_falls_back_when_ffmpeg_cannot_open_https(self):
        import subprocess

        parser = app.parser_module

        class FakeResponse:
            def raise_for_status(self):
                return None

            def iter_content(self, chunk_size):
                self.chunk_size = chunk_size
                yield b"encrypted-video"

        class FakeSession:
            def get(self, *args, **kwargs):
                self.args = args
                self.kwargs = kwargs
                return FakeResponse()

        with tempfile.TemporaryDirectory() as tmp:
            work_dir = Path(tmp)
            calls = []

            def run_ffmpeg(command, **kwargs):
                calls.append(command)
                input_value = command[command.index("-i") + 1]
                if str(input_value).startswith("https://"):
                    raise subprocess.CalledProcessError(1, command, stderr="TLS failed")
                self.assertEqual(Path(input_value).read_bytes(), b"encrypted-video")
                Path(command[-1]).write_bytes(b"playable-video")

            with mock.patch.object(parser, "get_media_work_dir", return_value=work_dir), \
                 mock.patch.object(parser, "get_ffmpeg_binary", return_value="ffmpeg"), \
                 mock.patch.object(parser, "get_http_session", return_value=FakeSession()), \
                 mock.patch.object(parser.subprocess, "run", side_effect=run_ffmpeg):
                result = parser.stream_copy_video_with_ffmpeg(
                    None, "https://cdn.example/video.mp4", b"0123456789abcdef",
                )

            output = work_dir / Path(result).name
            self.assertEqual(output.read_bytes(), b"playable-video")
            self.assertGreaterEqual(len(calls), 2)
            self.assertFalse(any(path.name.endswith(".source.mp4") for path in work_dir.iterdir()))

    def test_parser_http_requests_ignore_unavailable_proxy_environment(self):
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

        parser = app.parser_module

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"direct")

            def log_message(self, *_args):
                return

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        server_thread = __import__("threading").Thread(target=server.serve_forever, daemon=True)
        server_thread.start()
        dead_proxy = "http://127.0.0.1:1"
        proxy_environment = {
            "HTTP_PROXY": dead_proxy,
            "HTTPS_PROXY": dead_proxy,
            "ALL_PROXY": dead_proxy,
            "NO_PROXY": "",
        }
        try:
            with mock.patch.dict(os.environ, proxy_environment, clear=False), \
                 ThreadPoolExecutor(max_workers=1) as pool:
                response = pool.submit(
                    parser.curl_request,
                    f"http://127.0.0.1:{server.server_port}/video-model",
                    {}, None, 2,
                ).result(timeout=3)
            self.assertEqual(response, b"direct")
        finally:
            server.shutdown()
            server.server_close()

    def test_downloads_default_to_user_videos_folder(self):
        with mock.patch.dict(os.environ, {"DUANJU_DOWNLOAD_DIR": ""}):
            root = desktop_downloads.default_output_root(Path("C:/Users/TestUser"))
        self.assertEqual(root, Path("C:/Users/TestUser/Videos/短剧下载"))

    def test_save_settings_rejects_drive_root_and_clamps_workers(self):
        with tempfile.TemporaryDirectory() as tmp:
            data_root = Path(tmp)
            with mock.patch.object(tauri_bridge, "ROOT", data_root):
                # A sub-folder is accepted and workers are clamped to [2, 8].
                result = tauri_bridge.save_settings({
                    "download_dir": str(data_root / "media"),
                    "download_workers": 32,
                })
                self.assertTrue(result["saved"])
                self.assertEqual(result["config"]["download_dir"], str((data_root / "media").resolve()))
                self.assertEqual(result["config"]["download_workers"], 8)
                # A bare drive root must be rejected.
                with self.assertRaises(ValueError):
                    tauri_bridge.save_settings({"download_dir": "C:\\"})
                # Below-minimum workers clamp up to 2.
                result = tauri_bridge.save_settings({"download_workers": 0})
                self.assertEqual(result["config"]["download_workers"], 2)

    def test_local_media_is_found_in_output_work_folder(self):
        with tempfile.TemporaryDirectory() as tmp:
            output_root = Path(tmp) / "Videos" / "短剧下载"
            work_dir = desktop_downloads.media_work_dir(output_root)
            work_dir.mkdir(parents=True)
            media = work_dir / "episode.mp4"
            media.write_bytes(b"video")
            result = {"url": "http://127.0.0.1/src/episode.mp4"}
            self.assertEqual(
                desktop_downloads.local_path_from_result(result, Path(tmp), output_root),
                media,
            )

    def test_local_filename_is_preferred_over_url(self):
        """Desktop results carry local_filename so the bridge need not parse the URL."""
        with tempfile.TemporaryDirectory() as tmp:
            output_root = Path(tmp) / "Videos" / "短剧下载"
            work_dir = desktop_downloads.media_work_dir(output_root)
            work_dir.mkdir(parents=True)
            media = work_dir / "video_123.mp4"
            media.write_bytes(b"video")
            # No url at all; only the desktop-provided filename is present.
            result = {"local_filename": "video_123.mp4"}
            self.assertEqual(
                desktop_downloads.local_path_from_result(result, Path(tmp), output_root),
                media,
            )

    def test_completed_merge_leaves_no_series_in_merging_state(self):
        tasks = [
            {"series_id": "s1", "merge_status": "正在合并", "merge_progress": 72.0, "url": ""},
            {"series_id": "s1", "merge_status": "正在合并", "merge_progress": 72.0, "url": ""},
            {"series_id": "s2", "merge_status": "等待全集", "merge_progress": 0.0, "url": ""},
        ]

        desktop_state.complete_series_merge(tasks, "s1", Path("D:/downloads/全集.mp4"))

        merged = [task for task in tasks if task["series_id"] == "s1"]
        self.assertTrue(all(task["merge_status"] == "已合并" for task in merged))
        self.assertTrue(all(task["merge_progress"] == 100.0 for task in merged))
        self.assertTrue(all(task["msg"] == "全集合并完成" for task in merged))
        self.assertTrue(all(task["local_path"] == "D:\\downloads\\全集.mp4" for task in merged))
        self.assertTrue(all(task["merged_path"] == "D:\\downloads\\全集.mp4" for task in merged))
        self.assertEqual(tasks[2]["merge_status"], "等待全集")

    def test_legacy_merged_record_repairs_deleted_episode_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            merged = Path(tmp) / "测试短剧_全集.mp4"
            merged.write_bytes(b"video")
            tasks = [{
                "merge_status": "已合并",
                "local_path": str(Path(tmp) / ".parts" / "deleted.mp4"),
                "url": str(merged),
            }]

            changed = desktop_state.repair_merged_media_paths(tasks)

            expected = str(merged.resolve())
            self.assertTrue(changed)
            self.assertEqual(tasks[0]["merged_path"], expected)
            self.assertEqual(tasks[0]["local_path"], expected)
            self.assertEqual(tasks[0]["url"], expected)

    def test_queue_claims_new_waiting_tasks_without_retrying_failures(self):
        tasks = [
            {"id": "1", "status": "完成", "msg": "完成"},
            {"id": "2", "status": "失败", "msg": "网络错误"},
            {"id": "3", "status": "等待", "msg": "等待下载"},
            {"id": "4", "status": "等待", "msg": "等待下载"},
        ]

        claimed = desktop_state.claim_waiting_tasks(tasks, limit=1)

        self.assertEqual([task["id"] for task in claimed], ["3"])
        self.assertEqual(tasks[2]["status"], "排队中")
        self.assertEqual(tasks[1]["status"], "失败")
        self.assertEqual(tasks[3]["status"], "等待")

    def test_running_worker_picks_up_newly_enqueued_tasks_from_disk(self):
        """Tasks enqueued while the engine is running must join the in-memory list."""
        # In-memory snapshot the worker started with: one mid-flight, one done.
        in_memory = [
            {"id": "1", "status": "下载中", "msg": "正在解析并下载"},
            {"id": "2", "status": "完成", "msg": "完成"},
        ]
        # Disk now has a brand-new waiting task plus the in-flight one (unchanged).
        disk = [
            {"id": "1", "status": "下载中", "msg": "正在解析并下载"},
            {"id": "3", "status": "等待", "msg": "等待下载"},
        ]
        merged, appended = desktop_state.merge_new_waiting_tasks(disk, in_memory)
        self.assertEqual(appended, 1)
        self.assertEqual([task["id"] for task in merged], ["1", "2", "3"])
        # The in-flight task must not be duplicated or reset.
        self.assertEqual([task["status"] for task in merged if task["id"] == "1"], ["下载中"])
        self.assertEqual(merged[-1]["status"], "等待")

    def test_invalid_task_store_is_preserved_and_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "desktop_tasks.json"
            path.write_text('{"unexpected": "object"}', encoding="utf-8")

            tasks, warning = desktop_state.load_task_records(path)

            self.assertEqual(tasks, [])
            self.assertIn("任务记录格式无效", warning)
            self.assertEqual(path.read_text(encoding="utf-8"), '{"unexpected": "object"}')

    def test_interrupted_tasks_return_to_waiting_on_load(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "desktop_tasks.json"
            path.write_text('[{"id":"1","status":"下载中"},{"id":"2","status":"排队中"},{"id":"3","status":"完成"}]', encoding="utf-8")

            tasks, warning = desktop_state.load_task_records(path)

            self.assertEqual(warning, "")
            self.assertEqual([task["status"] for task in tasks], ["等待", "等待", "完成"])

    def test_series_delete_key_groups_all_episodes(self):
        first = {"series_id": "series-1", "series_title": "测试短剧", "title": "测试短剧 第1集", "id": "1"}
        second = {"series_id": "series-1", "series_title": "测试短剧", "title": "测试短剧 第2集", "id": "2"}
        other = {"series_id": "series-2", "series_title": "另一部", "title": "另一部 第1集", "id": "3"}

        key = tauri_bridge.task_series_key(first)

        self.assertEqual(key, "series:series-1")
        self.assertEqual(tauri_bridge.task_series_key(second), key)
        self.assertNotEqual(tauri_bridge.task_series_key(other), key)

    def test_legacy_episode_titles_share_delete_key(self):
        first = {"title": "旧短剧 第1集", "id": "1"}
        second = {"title": "旧短剧 第2集", "id": "2"}
        self.assertEqual(tauri_bridge.task_series_key(first), tauri_bridge.task_series_key(second))

    def test_delete_series_removes_only_matching_task_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            task_file = Path(tmp) / "desktop_tasks.json"
            running_file = Path(tmp) / ".frame_running"
            desktop_downloads.save_tasks(task_file, [
                {"series_id": "series-1", "id": "1"},
                {"series_id": "series-1", "id": "2"},
                {"series_id": "series-2", "id": "3"},
            ])
            with mock.patch.object(tauri_bridge, "TASK_FILE", task_file), \
                 mock.patch.object(tauri_bridge, "RUNNING_FILE", running_file), \
                 mock.patch.object(tauri_bridge, "modules", return_value=(None, desktop_downloads, desktop_state)):
                result = tauri_bridge.delete_series({"series_key": "series:series-1"})

            remaining, warning = desktop_state.load_task_records(task_file)
            self.assertEqual(result, {"removed": 2})
            self.assertEqual(warning, "")
            self.assertEqual([task["id"] for task in remaining], ["3"])

    def test_delete_series_removes_episode_parts_but_keeps_merged_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            task_file = Path(tmp) / "desktop_tasks.json"
            running_file = Path(tmp) / ".frame_running"
            parts_dir = Path(tmp) / ".parts"
            parts_dir.mkdir()
            episode_part = parts_dir / "video_ep1.mp4"
            episode_part.write_bytes(b"episode")
            merged_file = Path(tmp) / "merged" / "剧集_全集.mp4"
            merged_file.parent.mkdir()
            merged_file.write_bytes(b"merged")
            desktop_downloads.save_tasks(task_file, [
                {"series_id": "series-1", "id": "1", "local_path": str(episode_part), "merge_status": ""},
                {"series_id": "series-1", "id": "2", "local_path": str(merged_file), "merge_status": "已合并"},
            ])
            with mock.patch.object(tauri_bridge, "TASK_FILE", task_file), \
                 mock.patch.object(tauri_bridge, "RUNNING_FILE", running_file), \
                 mock.patch.object(tauri_bridge, "modules", return_value=(None, desktop_downloads, desktop_state)):
                tauri_bridge.delete_series({"series_key": "series:series-1"})
            # Unmerged episode part is gone; the user's merged collection is kept.
            self.assertFalse(episode_part.exists())
            self.assertTrue(merged_file.exists())

    def test_clear_removes_unmerged_episode_parts(self):
        with tempfile.TemporaryDirectory() as tmp:
            task_file = Path(tmp) / "desktop_tasks.json"
            running_file = Path(tmp) / ".frame_running"
            parts_dir = Path(tmp) / ".parts"
            parts_dir.mkdir()
            part = parts_dir / "video_leftover.mp4"
            part.write_bytes(b"episode")
            desktop_downloads.save_tasks(task_file, [
                {"id": "1", "local_path": str(part), "merge_status": ""},
            ])
            with mock.patch.object(tauri_bridge, "TASK_FILE", task_file), \
                 mock.patch.object(tauri_bridge, "RUNNING_FILE", running_file), \
                 mock.patch.object(tauri_bridge, "modules", return_value=(None, desktop_downloads, desktop_state)):
                tauri_bridge.clear({})
            self.assertFalse(part.exists())

    def test_desktop_workspace_has_four_human_focused_pages(self):
        root = tk.Tk()
        root.withdraw()
        try:
            desktop = desktop_app.DesktopApp(root)
            self.assertEqual(set(desktop.pages), {"home", "search", "tasks", "settings"})
        finally:
            root.destroy()

    def test_bad_page_is_normalized(self):
        self.assertEqual(app.parse_positive_int("bad"), 1)

    def test_series_episode_ids_are_extracted(self):
        html = '<script>{"series_id":"123","vid_list":["901","902"]}</script>'
        original = app.fetch_text
        app.fetch_text = lambda _url: html
        try:
            self.assertEqual(app.resolve_hongguo_episode_ids("123"), ["901", "902"])
        finally:
            app.fetch_text = original

    def test_hongguo_card_includes_real_cover_url(self):
        html = '''
        <a href="/detail?series_id=123">
          <img data-src="//cdn.example.com/covers/drama.webp" />
          <span class="title">测试短剧</span><span>全80集</span>
        </a>
        '''
        items = app.parse_hongguo_cards(html)
        self.assertEqual(items[0]["cover_url"], "https://cdn.example.com/covers/drama.webp")

    def test_detail_preload_image_is_used_as_cover(self):
        html = '<link rel="preload" as="image" href="//cdn.example.com/detail-cover.webp">'
        soup = app.BeautifulSoup(html, "html.parser")
        self.assertEqual(
            app.extract_cover_url(soup, "https://hongguoduanju.com/detail"),
            "https://cdn.example.com/detail-cover.webp",
        )

    def test_generic_card_uses_srcset_cover(self):
        html = '''
        <a href="/play?id=abc">测试短剧 全20集
          <img srcset="/cover-small.jpg 1x, /cover-large.jpg 2x" />
        </a>
        '''
        items = app.parse_generic_cards(html, "https://video.example.com", "测试平台", "测试")
        self.assertEqual(items[0]["cover_url"], "https://video.example.com/cover-large.jpg")

    def test_series_is_ready_only_when_every_episode_exists(self):
        with tempfile.TemporaryDirectory() as tmp:
            one = Path(tmp) / "1.mp4"
            two = Path(tmp) / "2.mp4"
            one.write_bytes(b"one")
            two.write_bytes(b"two")
            tasks = [
                {"series_id": "s", "status": "完成", "local_path": str(one)},
                {"series_id": "s", "status": "完成", "local_path": str(two)},
            ]
            self.assertTrue(desktop_downloads.series_ready(tasks, "s"))
            two.unlink()
            self.assertFalse(desktop_downloads.series_ready(tasks, "s"))

    def test_windows_unsafe_title_is_sanitized(self):
        self.assertEqual(desktop_downloads.safe_filename('a:b/c*?'), "a_b_c__")

    def test_extracts_novelquickapp_link_from_share_text(self):
        text = '【一起看】https://novelquickapp.com/s/dmg3NY123AM/ 复制打开'
        self.assertEqual(app.extract_novelquickapp_urls(text), ["https://novelquickapp.com/s/dmg3NY123AM/"])

    def test_parses_novelquickapp_router_data(self):
        payload = {
            "loaderData": {"video-animation-share_page": {"pageData": {
                "series_data": {"title": "测试短剧", "serial_count": 2},
                "chapter_ids": ["101", "102"], "chapter_order": 1,
            }}}
        }
        html = f'<script>window._ROUTER_DATA = {__import__("json").dumps(payload)}</script>'
        parsed = app.parse_novelquickapp_share_html(html, "https://novelquickapp.com/s/test/")
        self.assertEqual(parsed["title"], "测试短剧")
        self.assertEqual(parsed["episode_ids"], ["101", "102"])

    def test_merge_progress_callback_is_monotonic(self):
        values = [2.0, 18.5, 67.2, 100.0]
        self.assertEqual(values, sorted(values))
        self.assertEqual(values[-1], 100.0)

    def test_compatible_episodes_take_fast_merge_path(self):
        import shutil
        import subprocess
        ffmpeg = shutil.which("ffmpeg") or str(Path(__file__).resolve().parents[1] / "ffmpeg.exe")
        if not Path(ffmpeg).exists():
            self.skipTest("ffmpeg not found")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "1.mp4"
            second = root / "2.mp4"
            subprocess.run(
                [ffmpeg, "-y", "-f", "lavfi", "-i", "color=c=black:s=160x90:d=0.2",
                 "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(first)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            shutil.copy2(first, second)
            tasks = [
                {"series_id": "series", "series_title": "测试片", "episode": 1, "status": "完成", "local_path": str(first)},
                {"series_id": "series", "series_title": "测试片", "episode": 2, "status": "完成", "local_path": str(second)},
            ]
            progress = []
            with mock.patch.object(desktop_downloads, "normalize_episode", side_effect=AssertionError("unexpected transcode")):
                output = desktop_downloads.merge_series(tasks, "series", root / "output", ffmpeg, progress_callback=progress.append)
            self.assertTrue(output.is_file() and output.stat().st_size > 0)
            self.assertEqual(progress[-1], 100.0)

    def test_corrupt_merge_keeps_original_episodes_when_probe_available(self):
        """A merge output the probe rejects must not delete source episodes.

        The fast concat path and the transcode-then-concat path both probe the
        final file; if ffprobe rejects it, the original episodes must survive
        so the user is not left with a corrupt merge and no recoverable sources.
        """
        import shutil
        ffmpeg = shutil.which("ffmpeg") or str(Path(__file__).resolve().parents[1] / "ffmpeg.exe")
        ffprobe = desktop_downloads.get_ffprobe_binary()
        if not Path(ffmpeg).exists():
            self.skipTest("ffmpeg not found")
        if not ffprobe or not Path(ffprobe).exists():
            self.skipTest("ffprobe not available")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "1.mp4"
            second = root / "2.mp4"
            first.write_bytes(b"not-a-real-mp4-original-1")
            second.write_bytes(b"not-a-real-mp4-original-2")
            tasks = [
                {"series_id": "series", "series_title": "测试片", "episode": 1, "status": "完成", "local_path": str(first)},
                {"series_id": "series", "series_title": "测试片", "episode": 2, "status": "完成", "local_path": str(second)},
            ]

            def fake_concat(_bin, _concat_file, output):
                # Simulate ffmpeg writing a non-empty file that ffprobe will reject.
                output.write_bytes(b"corrupt-but-nonempty-merged-output")

            def fake_normalize(_bin, _source, target):
                target.write_bytes(b"corrupt-but-nonempty-normalized")

            with mock.patch.object(desktop_downloads, "_concat_copy", side_effect=fake_concat), \
                 mock.patch.object(desktop_downloads, "normalize_episode", side_effect=fake_normalize):
                with self.assertRaises(Exception):
                    desktop_downloads.merge_series(tasks, "series", root / "output", ffmpeg, ffprobe_bin=ffprobe)
            # Originals must survive because the probe rejected both merge attempts.
            self.assertTrue(first.is_file() and first.read_bytes().startswith(b"not-a-real-mp4-original-1"))
            self.assertTrue(second.is_file() and second.read_bytes().startswith(b"not-a-real-mp4-original-2"))

    def test_failed_transcode_cleans_up_normalized_scratch_dir(self):
        """A failed NVENC/x264 pass must not leave re-encoded episodes on disk."""
        import shutil
        ffmpeg = shutil.which("ffmpeg") or str(Path(__file__).resolve().parents[1] / "ffmpeg.exe")
        ffprobe = desktop_downloads.get_ffprobe_binary()
        if not Path(ffmpeg).exists():
            self.skipTest("ffmpeg not found")
        if not ffprobe or not Path(ffprobe).exists():
            self.skipTest("ffprobe not available")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "1.mp4"
            first.write_bytes(b"not-a-real-mp4-original-1")
            tasks = [
                {"series_id": "series", "series_title": "测试片", "episode": 1, "status": "完成", "local_path": str(first)},
            ]

            def fake_concat(_bin, _concat_file, output):
                output.write_bytes(b"corrupt-but-nonempty")

            def boom(_bin, _source, _target):
                raise RuntimeError("nvenc exploded")

            with mock.patch.object(desktop_downloads, "_concat_copy", side_effect=fake_concat), \
                 mock.patch.object(desktop_downloads, "normalize_episode", side_effect=boom):
                with self.assertRaises(Exception):
                    desktop_downloads.merge_series(tasks, "series", root / "output", ffmpeg, ffprobe_bin=ffprobe)
            # The .normalized scratch folder must be gone after the failure.
            self.assertFalse(any(path.name == ".normalized" for path in root.rglob(".normalized")))

    def test_four_download_workers_run_concurrently(self):
        import threading
        barrier = threading.Barrier(4)
        def worker(value):
            barrier.wait(timeout=2)
            return value
        with ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(sorted(pool.map(worker, range(4))), [0, 1, 2, 3])

    def test_nvenc_normalization_is_gpu_only(self):
        import subprocess, shutil
        src = Path(tempfile.gettempdir()) / "_test_normalize_src.mp4"
        dst = Path(tempfile.gettempdir()) / "_test_normalize_dst.mp4"
        ffmpeg = shutil.which("ffmpeg") or str(Path(__file__).resolve().parents[1] / "ffmpeg.exe")
        if not Path(ffmpeg).exists():
            self.skipTest("ffmpeg not found")
        try:
            # generate a 0.5s test clip so NVENC probe succeeds
            subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i", "testsrc=duration=0.5:size=320x240,format=yuv420p",
                            "-f", "lavfi", "-i", "sine=duration=0.5", "-shortest",
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", str(src)],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                           creationflags=subprocess.CREATE_NO_WINDOW if __import__("os").name == "nt" else 0)
            # must NOT raise — NVENC is mandatory
            desktop_downloads.normalize_episode(ffmpeg, src, dst)
            self.assertTrue(dst.is_file() and dst.stat().st_size > 0)
        finally:
            src.unlink(missing_ok=True)
            dst.unlink(missing_ok=True)

    def test_fetch_text_uses_cache(self):
        hits = {"count": 0}
        original = app.get_http_session

        class FakeResponse:
            encoding = "utf-8"

            def raise_for_status(self):
                return None

            @property
            def apparent_encoding(self):
                return "utf-8"

            @property
            def text(self):
                return "hello"

        class FakeSession:
            def get(self, *args, **kwargs):
                hits["count"] += 1
                return FakeResponse()

        app._TEXT_CACHE.clear()
        app.get_http_session = lambda: FakeSession()
        try:
            self.assertEqual(app.fetch_text("https://example.com"), "hello")
            self.assertEqual(app.fetch_text("https://example.com"), "hello")
            self.assertEqual(hits["count"], 1)
        finally:
            app.get_http_session = original
            app._TEXT_CACHE.clear()

    def test_remote_cover_is_cached_for_webview_assets(self):
        hits = {"count": 0}

        class FakeResponse:
            content = b"\x89PNG\r\n\x1a\ncover"
            headers = {"content-type": "image/png"}

            def raise_for_status(self):
                return None

        class FakeSession:
            def get(self, *args, **kwargs):
                hits["count"] += 1
                return FakeResponse()

        class FakeApp:
            @staticmethod
            def get_http_session():
                return FakeSession()

        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(tauri_bridge, "COVER_DIR", Path(tmp)):
            first = Path(tauri_bridge.cache_cover(FakeApp, "https://cdn.example.com/poster.png"))
            second = Path(tauri_bridge.cache_cover(FakeApp, "https://cdn.example.com/poster.png"))
            self.assertTrue(first.is_file())
            self.assertEqual(first, second)
            self.assertEqual(hits["count"], 1)

    def test_search_returns_cached_cover_without_detail_request(self):
        fake_app = mock.Mock()
        fake_app.search_short_drama.return_value = [{
            "title": "测试短剧", "drama_id": "123", "source_url": "https://example.com/detail?series_id=123",
            "cover_url": "",
        }]
        fake_state = mock.Mock()
        with (
            tempfile.TemporaryDirectory() as tmp,
            mock.patch.object(tauri_bridge, "modules", return_value=(fake_app, mock.Mock(), fake_state)),
            mock.patch.object(tauri_bridge, "known_covers", return_value={"123": {"cover_url": "https://cdn.example.com/cover.jpg", "cover_path": str(Path(tmp) / "cover.jpg")}}),
        ):
            (Path(tmp) / "cover.jpg").write_bytes(b"cover")
            result = tauri_bridge.search({"keyword": "测试", "page": 1, "source": "红果短剧"})
        self.assertEqual(result["items"][0]["cover_url"], "https://cdn.example.com/cover.jpg")
        self.assertTrue(result["items"][0]["cover_path"].endswith("cover.jpg"))

    def test_background_cover_hydration_resolves_and_indexes_cover(self):
        fake_app = mock.Mock()
        fake_state = mock.Mock()
        with (
            mock.patch.object(tauri_bridge, "modules", return_value=(fake_app, mock.Mock(), fake_state)),
            mock.patch.object(tauri_bridge, "known_covers", return_value={}),
            mock.patch.object(tauri_bridge, "cover_for_task", return_value="https://cdn.example.com/cover.jpg") as resolve,
            mock.patch.object(tauri_bridge, "cache_cover", return_value="C:/covers/cover.jpg"),
            mock.patch.object(tauri_bridge, "save_cover_index") as save_index,
        ):
            result = tauri_bridge.hydrate_covers({"items": [{"drama_id": "123", "source_url": "https://example.com/detail?series_id=123"}]})
        self.assertEqual(result["items"][0]["cover_path"], "C:/covers/cover.jpg")
        resolve.assert_called_once()
        save_index.assert_called_once()

    def test_auto_merge_defaults_to_enabled(self):
        self.assertTrue({}.get("auto_merge", True))
        self.assertFalse({"auto_merge": False}.get("auto_merge", True))


if __name__ == "__main__":
    unittest.main()

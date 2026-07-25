"""Small JSON bridge used by the Tauri shell.

The bridge keeps the existing parser and FFmpeg pipeline as the source of truth,
while the webview only deals with presentation and user intent.
"""
from __future__ import annotations

import json
import hashlib
import os
import re
import subprocess
import sys
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


CODE_ROOT = Path(__file__).resolve().parent
ROOT = Path(os.getenv("FRAME_DATA_DIR", str(CODE_ROOT))).expanduser().resolve()
ROOT.mkdir(parents=True, exist_ok=True)
TASK_FILE = ROOT / "desktop_tasks.json"
RUNNING_FILE = ROOT / ".frame_running"
PAUSE_FILE = ROOT / ".frame_pause"
COVER_CACHE: dict[str, str] = {}
COVER_DIR = ROOT / "covers"
COVER_INDEX_FILE = ROOT / "cover_index.json"


def modules():
    ensure_runtime_config()
    import app
    import desktop_downloads as downloads
    import desktop_state
    return app, downloads, desktop_state


def ensure_runtime_config() -> Path:
    """Seed the writable AppData config once from the packaged empty template.

    Never copy a real ``config.json`` — that file may hold a developer's live
    device_id/install_id and would leak into the installer. The shipped
    template (``config.example.json``) only ever contains blank fields; the
    AppData copy is populated from the UI.
    """
    configured = str(os.getenv("DUANJU_CONFIG_PATH") or "").strip()
    target = Path(os.path.expandvars(configured)).expanduser() if configured else ROOT / "config.json"
    if target.exists():
        return target
    default = CODE_ROOT / "config.example.json"
    fallback = CODE_ROOT / "config.json"
    source = default if default.exists() else fallback
    if not source.exists():
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return target


def read_config() -> dict:
    try:
        data = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def output_root(config: dict, downloads) -> Path:
    configured = str(config.get("download_dir") or os.getenv("DUANJU_DOWNLOAD_DIR") or "").strip()
    target = Path(os.path.expandvars(configured)).expanduser() if configured else downloads.default_output_root()
    target = target.resolve()
    os.environ["DUANJU_DOWNLOAD_DIR"] = str(target)
    return target


def load_tasks(desktop_state):
    tasks, warning = desktop_state.load_task_records(TASK_FILE)
    return tasks, warning


def save_tasks(downloads, tasks):
    downloads.save_tasks(TASK_FILE, tasks)


def cover_for_task(app, task: dict) -> str:
    """Resolve one persisted task's cover, cached by source URL/series ID."""
    current = str(task.get("cover_url") or "").strip()
    if current:
        return current
    source_url = str(task.get("source_url") or "").strip()
    series_id = str(task.get("series_id") or "").strip()
    if not series_id and str(task.get("id") or "").isdigit() and "video entry not found" in str(task.get("msg") or ""):
        series_id = str(task.get("id") or "").strip()
    cache_key = source_url or series_id
    if not cache_key:
        return ""
    if cache_key in COVER_CACHE:
        return COVER_CACHE[cache_key]
    cover = ""
    try:
        if "hongguoduanju.com/detail" in source_url or series_id.isdigit():
            url = source_url or f"https://hongguoduanju.com/detail?series_id={series_id}"
            html = app.fetch_text(url, 8)
            soup = app.BeautifulSoup(html, "html.parser")
            target = None
            if series_id:
                target = soup.select_one(f'a[href*="series_id={series_id}"]')
            cover = app.extract_cover_url(target or soup, url)
        elif "novelquickapp.com/s/" in source_url:
            info = app.parse_novelquickapp_share_html(app.fetch_text(source_url, 8), source_url)
            cover = str(info.get("cover_url") or "")
    except Exception:
        cover = ""
    COVER_CACHE[cache_key] = cover
    return cover


def cache_cover(app, url: str) -> str:
    """Cache remote artwork so WebView rendering does not depend on hotlink rules."""
    url = str(url or "").strip()
    if not url.startswith(("http://", "https://")):
        return ""
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    existing = next(COVER_DIR.glob(f"{digest}.*"), None)
    if existing and existing.is_file() and existing.stat().st_size > 0:
        return str(existing)
    response = app.get_http_session().get(url, timeout=8)
    response.raise_for_status()
    content = response.content
    content_type = str(response.headers.get("content-type") or "").split(";", 1)[0].lower()
    if not content or len(content) > 8 * 1024 * 1024 or not content_type.startswith("image/"):
        return ""
    extension = {
        "image/avif": ".avif", "image/gif": ".gif", "image/jpeg": ".jpg",
        "image/png": ".png", "image/webp": ".webp",
    }.get(content_type, ".img")
    target = COVER_DIR / f"{digest}{extension}"
    partial = target.with_suffix(target.suffix + ".part")
    partial.write_bytes(content)
    partial.replace(target)
    return str(target)


def load_cover_index() -> dict:
    try:
        data = json.loads(COVER_INDEX_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_cover_index(index: dict) -> None:
    COVER_INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    partial = COVER_INDEX_FILE.with_suffix(".json.tmp")
    partial.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    partial.replace(COVER_INDEX_FILE)


def known_covers(desktop_state) -> dict:
    known = load_cover_index()
    tasks, _ = load_tasks(desktop_state)
    for task in tasks:
        series_id = str(task.get("series_id") or "")
        if not series_id:
            continue
        cover_url = str(task.get("cover_url") or "")
        cover_path = str(task.get("cover_path") or "")
        if cover_url or (cover_path and Path(cover_path).is_file()):
            known[series_id] = {"cover_url": cover_url, "cover_path": cover_path}
    return known


def enrich_task_covers(app, downloads, tasks) -> bool:
    changed = False
    seen = set()
    for task in tasks:
        key = str(task.get("source_url") or task.get("series_id") or "")
        if key in seen:
            continue
        seen.add(key)
        cover = cover_for_task(app, task)
        if not cover:
            continue
        try:
            cover_path = cache_cover(app, cover)
        except Exception:
            cover_path = ""
        for sibling in tasks:
            if str(sibling.get("source_url") or sibling.get("series_id") or "") != key:
                continue
            if not sibling.get("cover_url"):
                sibling["cover_url"] = cover; changed = True
            if cover_path and sibling.get("cover_path") != cover_path:
                sibling["cover_path"] = cover_path; changed = True
    if changed:
        save_tasks(downloads, tasks)
    return changed


def snapshot(_payload):
    app, downloads, desktop_state = modules()
    config = read_config()
    root = output_root(config, downloads)
    tasks, warning = load_tasks(desktop_state)
    if desktop_state.repair_merged_media_paths(tasks):
        save_tasks(downloads, tasks)
    enrich_task_covers(app, downloads, tasks)
    return {
        "tasks": tasks,
        "warning": warning,
        "config": config,
        "output_dir": str(root),
        "running": RUNNING_FILE.exists(),
        "paused": PAUSE_FILE.exists(),
    }


def search(payload):
    app, _, desktop_state = modules()
    keyword = str(payload.get("keyword") or "").strip()
    page = max(1, int(payload.get("page") or 1))
    source = str(payload.get("source") or "红果短剧")
    category = str(payload.get("category") or "")
    items = app.search_short_drama(keyword, page, source, category)
    cached = known_covers(desktop_state)
    for item in items:
        record = cached.get(str(item.get("drama_id") or ""))
        if not isinstance(record, dict):
            continue
        cover_path = str(record.get("cover_path") or "")
        item["cover_url"] = str(record.get("cover_url") or "")
        item["cover_path"] = cover_path if cover_path and Path(cover_path).is_file() else ""
    return {"items": items}


def hydrate_covers(payload):
    app, _, desktop_state = modules()
    items = payload.get("items") if isinstance(payload.get("items"), list) else []
    items = [dict(item) for item in items[:50] if isinstance(item, dict)]
    index = known_covers(desktop_state)

    def hydrate(item):
        series_id = str(item.get("drama_id") or "")
        record = index.get(series_id) if series_id else None
        if isinstance(record, dict):
            cover_path = str(record.get("cover_path") or "")
            if cover_path and Path(cover_path).is_file():
                return {"drama_id": series_id, "cover_url": str(record.get("cover_url") or ""), "cover_path": cover_path}
        cover = str(item.get("cover_url") or "") or cover_for_task(app, {
            "series_id": series_id,
            "source_url": item.get("source_url"),
        })
        if not cover:
            return {"drama_id": series_id, "cover_url": "", "cover_path": ""}
        try:
            cover_path = cache_cover(app, cover)
        except Exception:
            cover_path = ""
        return {"drama_id": series_id, "cover_url": cover, "cover_path": cover_path}

    with ThreadPoolExecutor(max_workers=min(12, max(1, len(items))), thread_name_prefix="covers") as pool:
        results = list(pool.map(hydrate, items))
    changed = False
    for result in results:
        series_id = result["drama_id"]
        if series_id and result["cover_url"]:
            index[series_id] = {"cover_url": result["cover_url"], "cover_path": result["cover_path"]}
            changed = True
    if changed:
        save_cover_index(index)
    return {"items": results}


def enqueue(payload):
    app, downloads, desktop_state = modules()
    raw = str(payload.get("raw") or "").strip()
    if not raw:
        return {"added": 0, "errors": ["没有可识别内容"]}
    tasks, _ = load_tasks(desktop_state)
    known_ids = {str(item.get("id")) for item in tasks}
    added = 0
    errors: list[str] = []

    # Search results identify a Hongguo series, while the downloader needs
    # per-episode video IDs. Resolve the series before falling back to the
    # manual single-ID path below.
    selected = payload.get("item") if isinstance(payload.get("item"), dict) else {}
    selected_id = str(selected.get("drama_id") or "").strip()
    selected_url = str(selected.get("source_url") or "").strip()
    is_series = bool(selected_id and (
        selected.get("id_type") == "series_id"
        or "hongguoduanju.com/detail" in selected_url
    ))
    if is_series:
        try:
            episode_ids = app.resolve_hongguo_episode_ids(selected_id, selected_url)
            if not episode_ids:
                errors.append(f"未找到《{selected.get('title') or selected_id}》的分集视频")
            for number, video_id in enumerate(episode_ids, 1):
                video_id = str(video_id)
                if video_id in known_ids:
                    continue
                title = str(selected.get("title") or selected_id)
                tasks.append({
                    "title": f"{title} 第{number}集" if len(episode_ids) > 1 else title,
                    "series_title": title, "episode": number,
                    "episode_total": len(episode_ids), "id": video_id,
                    "series_id": selected_id, "source_url": selected_url,
                    "cover_url": str(selected.get("cover_url") or ""),
                    "cover_path": str(selected.get("cover_path") or ""),
                    "status": "等待", "url": "", "local_path": "",
                    "merge_status": "等待全集", "merge_progress": 0.0, "msg": "等待下载",
                })
                known_ids.add(video_id); added += 1
            save_tasks(downloads, tasks)
            return {"added": added, "errors": errors}
        except Exception as exc:
            errors.append(f"解析短剧分集失败：{exc}")
            save_tasks(downloads, tasks)
            return {"added": added, "errors": errors}

    remaining = raw
    for url in app.extract_novelquickapp_urls(raw):
        remaining = remaining.replace(url, " ")
        try:
            info = app.resolve_novelquickapp_share(url)
            ids = info.get("episode_ids") or []
            for number, video_id in enumerate(ids, 1):
                if str(video_id) in known_ids:
                    continue
                tasks.append({
                    "title": f"{info['title']} 第{number}集" if len(ids) > 1 else info["title"],
                    "series_title": info["title"], "episode": number,
                    "episode_total": len(ids), "id": str(video_id),
                    "series_id": str(info["series_id"]), "source_url": url,
                    "cover_url": str(info.get("cover_url") or ""),
                    "status": "等待", "url": "", "local_path": "",
                    "merge_status": "等待全集", "merge_progress": 0.0, "msg": "等待下载",
                })
                known_ids.add(str(video_id)); added += 1
        except Exception as exc:
            errors.append(str(exc))
    ids = [part.strip() for part in remaining.replace("，", ",").replace(";", ",").replace("；", ",").replace("\n", ",").replace(" ", ",").split(",") if part.strip()]
    for video_id in ids:
        if not video_id.isdigit() or video_id in known_ids:
            continue
        tasks.append({"title": video_id, "id": video_id, "status": "等待", "url": "", "local_path": "", "msg": "等待下载"})
        known_ids.add(video_id); added += 1
    save_tasks(downloads, tasks)
    return {"added": added, "errors": errors}


def start_worker(_payload):
    if RUNNING_FILE.exists():
        return {"started": False, "reason": "already-running"}
    PAUSE_FILE.unlink(missing_ok=True)
    command = [sys.executable, str(Path(__file__).resolve()), "worker"]
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) | getattr(subprocess, "DETACHED_PROCESS", 0)
    RUNNING_FILE.write_text("starting", encoding="ascii")
    try:
        subprocess.Popen(command, cwd=ROOT, creationflags=flags, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        RUNNING_FILE.unlink(missing_ok=True)
        raise
    return {"started": True}


def pause_worker(_payload):
    PAUSE_FILE.touch()
    return {"paused": True}


def retry(payload):
    app, downloads, desktop_state = modules()
    tasks, _ = load_tasks(desktop_state)
    selected = {int(item) for item in payload.get("indexes", []) if str(item).isdigit()}
    count = 0
    migrated = []
    for index, task in enumerate(tasks):
        should_retry = (not selected or index in selected) and task.get("status") == "失败"
        legacy_series = should_retry and not task.get("series_id") and "video entry not found" in str(task.get("msg") or "")
        if legacy_series:
            series_id = str(task.get("id") or "").strip()
            try:
                episode_ids = app.resolve_hongguo_episode_ids(series_id, str(task.get("source_url") or ""))
            except Exception:
                episode_ids = []
            if episode_ids:
                title = str(task.get("series_title") or task.get("title") or series_id)
                for number, video_id in enumerate(episode_ids, 1):
                    migrated.append({
                        "title": f"{title} 第{number}集" if len(episode_ids) > 1 else title,
                        "series_title": title, "episode": number,
                        "episode_total": len(episode_ids), "id": str(video_id),
                        "series_id": series_id, "source_url": str(task.get("source_url") or ""),
                        "cover_url": str(task.get("cover_url") or ""),
                        "status": "等待", "url": "", "local_path": "",
                        "merge_status": "等待全集", "merge_progress": 0.0, "msg": "等待下载",
                    })
                count += len(episode_ids)
                continue
        if should_retry:
            task["status"] = "等待"; task["msg"] = "等待重试"; count += 1
        migrated.append(task)
    tasks[:] = migrated
    save_tasks(downloads, tasks)
    return {"retried": count}


def clear(_payload):
    if RUNNING_FILE.exists():
        raise RuntimeError("下载进行中，请先暂停")
    _, downloads, desktop_state = modules()
    tasks, _ = load_tasks(desktop_state)
    # Drop per-episode parts that were never merged, so .parts does not keep
    # accumulating leftovers from abandoned series.
    downloads.delete_episode_files(tasks)
    save_tasks(downloads, [])
    return {"cleared": True}


def normalize_series_title(task: dict) -> str:
    title = str(task.get("series_title") or task.get("title") or "未命名短剧").strip()
    title = re.sub(r"\s*第\s*\d+\s*[集话]\s*$", "", title)
    title = re.sub(r"\s+(?:EP|Episode)\s*\d+\s*$", "", title, flags=re.IGNORECASE)
    return title.strip() or str(task.get("title") or "未命名短剧").strip()


def task_series_key(task: dict, index: int = 0) -> str:
    series_id = str(task.get("series_id") or "").strip()
    if series_id:
        return f"series:{series_id}"
    source_url = str(task.get("source_url") or "").strip()
    if source_url:
        return f"source:{source_url}"
    title = normalize_series_title(task)
    return f"title:{title.lower()}" if title else f"task:{task.get('id') or index}"


def delete_series(payload):
    if RUNNING_FILE.exists():
        raise RuntimeError("下载进行中，请先暂停并等待当前任务结束")
    key = str(payload.get("series_key") or "").strip()
    if not key:
        raise ValueError("缺少短剧标识")
    _, downloads, desktop_state = modules()
    tasks, _ = load_tasks(desktop_state)
    # Remove this series' episode parts before dropping the records.
    doomed = [task for index, task in enumerate(tasks) if task_series_key(task, index) == key]
    downloads.delete_episode_files(doomed)
    remaining = [task for index, task in enumerate(tasks) if task_series_key(task, index) != key]
    removed = len(tasks) - len(remaining)
    if removed:
        save_tasks(downloads, remaining)
    return {"removed": removed}


def save_settings(payload):
    current = read_config()
    for key in ("device_id", "install_id", "platform", "auto_merge", "download_dir", "download_workers"):
        if key in payload:
            current[key] = payload[key]
    if current.get("download_dir"):
        resolved = Path(os.path.expandvars(str(current["download_dir"]))).expanduser().resolve()
        # Reject a bare drive root (e.g. "C:\\") so a mistyped save location
        # cannot turn the whole system drive into a media scratch folder.
        if len(resolved.parents) < 1 or resolved.parent == resolved.parent.parent:
            raise ValueError("下载目录不能是磁盘根目录，请选择一个子文件夹")
        current["download_dir"] = str(resolved)
    if "download_workers" in current:
        try:
            raw = current["download_workers"]
            workers = int(raw) if raw not in (None, "") else 4
            current["download_workers"] = min(8, max(2, workers))
        except (TypeError, ValueError):
            current["download_workers"] = 4
    (ROOT / "config.json").write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"saved": True, "config": current}


def worker():
    app, downloads, desktop_state = modules()
    config = read_config()
    root = output_root(config, downloads)
    RUNNING_FILE.write_text(str(os.getpid()), encoding="ascii")
    try:
        tasks, _ = load_tasks(desktop_state)
        workers = min(8, max(2, int(config.get("download_workers", 4) or 4)))
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="frame-episode") as pool:
            while not PAUSE_FILE.exists():
                claimed = desktop_state.claim_waiting_tasks(tasks, workers)
                if not claimed:
                    # No waiting task in memory — but the UI may have enqueued
                    # more while we were busy. Fold those in before giving up.
                    disk_tasks, _ = load_tasks(desktop_state)
                    tasks, appended = desktop_state.merge_new_waiting_tasks(disk_tasks, tasks)
                    if appended:
                        continue
                    break
                futures = {pool.submit(download_one, task, app, downloads, root): task for task in claimed}
                for future in as_completed(futures):
                    future.result()
                save_tasks(downloads, tasks)
                # Pick up tasks enqueued from the UI during this batch so a
                # running engine does not require a manual restart.
                disk_tasks, _ = load_tasks(desktop_state)
                tasks, _ = desktop_state.merge_new_waiting_tasks(disk_tasks, tasks)
        if not PAUSE_FILE.exists() and config.get("auto_merge", True):
            series_ids = {str(task.get("series_id")) for task in tasks if task.get("series_id")}
            ffprobe_bin = downloads.get_ffprobe_binary()
            ffmpeg_bin = app.parser_module.get_ffmpeg_binary()
            for series_id in series_ids:
                if downloads.series_ready(tasks, series_id):
                    output = downloads.merge_series(tasks, series_id, root, ffmpeg_bin, ffprobe_bin=ffprobe_bin)
                    desktop_state.complete_series_merge(tasks, series_id, output)
        save_tasks(downloads, tasks)
    finally:
        RUNNING_FILE.unlink(missing_ok=True)


def download_one(task, app, downloads, root):
    task["status"] = "下载中"; task["msg"] = "正在解析并下载"
    try:
        result = app.handle_video_request(task["id"], None, max_retries=3)
        local = downloads.local_path_from_result(result, app.parser_module.get_runtime_base_dir(), root)
        if local is None:
            raise RuntimeError("分集视频未保存到本地")
        task["url"] = result.get("url") or result.get("download_url") or ""
        task["local_filename"] = str(result.get("local_filename") or Path(local).name)
        task["local_path"] = str(local); task["status"] = "完成"; task["msg"] = "完成"
    except Exception as exc:
        task["status"] = "失败"; task["msg"] = str(exc)


HANDLERS = {"snapshot": snapshot, "search": search, "hydrate-covers": hydrate_covers, "enqueue": enqueue, "start": start_worker, "pause": pause_worker, "retry": retry, "clear": clear, "delete-series": delete_series, "save-settings": save_settings}


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "snapshot"
    if action == "worker":
        worker(); return
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        result = HANDLERS[action](payload)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()

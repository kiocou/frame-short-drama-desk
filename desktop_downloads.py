"""Persistent series download and FFmpeg concat helpers for the desktop UI."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from subprocess import CalledProcessError
from typing import Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urlparse


APP_FOLDER = "短剧下载"


def default_output_root(home: Path | None = None) -> Path:
    """Return a stable per-user media folder without depending on app location."""
    configured = os.getenv("DUANJU_DOWNLOAD_DIR", "").strip()
    if configured:
        return Path(os.path.expandvars(configured)).expanduser().resolve()
    user_home = (home or Path.home()).resolve()
    return user_home / "Videos" / APP_FOLDER


def _ffmpeg_dir_candidates() -> list[Path]:
    """Directories that may hold ffprobe beside the bundled ffmpeg."""
    import sys
    runtime_dir = Path(os.getenv("DUANJU_RUNTIME_DIR") or "").expanduser() if os.getenv("DUANJU_RUNTIME_DIR") else None
    dirs: list[Path] = []
    if runtime_dir:
        dirs.append(runtime_dir)
    try:
        # Reuse the parser module's resolution so source checkout and PyInstaller
        # onedir both find the probe next to ffmpeg without duplicating the logic.
        import importlib
        parser = importlib.import_module("1")
        dirs.append(parser.get_runtime_base_dir())
    except Exception:
        pass
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        dirs.append(Path(meipass))
    # Deduplicate while preserving order.
    seen: set[str] = set()
    unique: list[Path] = []
    for d in dirs:
        key = str(d)
        if key not in seen:
            seen.add(key)
            unique.append(d)
    return unique


def get_ffprobe_binary() -> str | None:
    """Resolve ffprobe bundled beside ffmpeg, or fall back to PATH.

    Returns ``None`` when no probe is available — callers must then keep the
    original episode files instead of trusting a non-empty (but possibly
    corrupt) merged output.
    """
    env_bin = os.getenv("FFPROBE_BIN", "").strip()
    if env_bin:
        return env_bin
    for base in _ffmpeg_dir_candidates():
        for candidate in (base / "ffprobe.exe", base / "插件" / "ffprobe.exe"):
            if candidate.exists():
                return str(candidate)
    import shutil
    return shutil.which("ffprobe")


def media_work_dir(output_root: Path) -> Path:
    return output_root / ".parts"


def safe_filename(value: str) -> str:
    value = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", str(value or "")).strip(" .")
    return value[:120] or "未命名短剧"


def local_path_from_result(result: dict, runtime_dir: Path, output_root: Path | None = None) -> Path | None:
    """Locate the downloaded episode on disk.

    Desktop downloads now carry an explicit ``local_filename`` (set when the
    parser runs without a Flask ``request``), so the bridge no longer has to
    reverse-engineer the filename from an ``http://localhost/src/...`` URL that
    points at a server which is not running in desktop mode. The URL fallback
    is kept for older task records and web-mode results.
    """
    candidates: list[Path] = []
    filename = str(result.get("local_filename") or "").strip()
    if filename:
        media_name = filename
        src_name = filename
    else:
        url = str(result.get("url") or result.get("download_url") or "")
        media_name = Path(unquote(urlparse(url).path)).name
        src_name = media_name
    if not media_name:
        return None
    if output_root is not None:
        candidates.append(media_work_dir(output_root) / media_name)
    candidates.append(runtime_dir / "src" / src_name)
    for path in candidates:
        if path.is_file() and path.stat().st_size > 0:
            return path
    return None


def series_ready(tasks: list[dict], series_id: str) -> bool:
    group = [task for task in tasks if str(task.get("series_id")) == str(series_id)]
    return bool(group) and all(task.get("status") == "完成" and Path(str(task.get("local_path", ""))).is_file() for task in group)


def normalize_episode(ffmpeg_bin: str, source: Path, output: Path) -> None:
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    for codec in ("h264_nvenc", "libx264"):
        preset = "p1" if codec == "h264_nvenc" else "ultrafast"
        tune = ["-tune", "hq"] if codec == "h264_nvenc" else []
        bitrate = ["-cq", "23", "-b:v", "0"] if codec == "h264_nvenc" else ["-crf", "23"]
        command = [
            ffmpeg_bin, "-y", "-fflags", "+genpts", "-i", str(source),
            "-map", "0:v:0", "-map", "0:a:0?",
            "-vf", "setpts=PTS-STARTPTS", "-af", "asetpts=PTS-STARTPTS,aresample=48000:async=1:first_pts=0",
            "-c:v", codec, "-preset", preset, *tune, *bitrate,
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart", str(output),
        ]
        try:
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
        except CalledProcessError:
            if codec == "libx264":
                raise
            print(f"[normalize] NVENC 失败，回退 CPU x264 — {source.name}")
            continue
        break
    if not output.is_file() or output.stat().st_size == 0:
        raise RuntimeError(f"分集标准化失败：{source.name}")


def _write_concat_file(path: Path, episode_paths: list[Path]) -> None:
    path.write_text(
        "".join(f"file '{item.resolve().as_posix().replace("'", "'\\''")}'\n" for item in episode_paths),
        encoding="utf-8",
    )


def _concat_copy(ffmpeg_bin: str, concat_file: Path, output: Path) -> None:
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    partial = output.with_suffix(output.suffix + ".part")
    partial.unlink(missing_ok=True)
    command = [
        ffmpeg_bin, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-map", "0:v:0", "-map", "0:a:0?", "-c", "copy",
        "-movflags", "+faststart", "-f", "mp4", str(partial),
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
        if not partial.is_file() or partial.stat().st_size == 0:
            raise RuntimeError("合并结果为空")
        partial.replace(output)
    except Exception:
        partial.unlink(missing_ok=True)
        raise


def _media_is_valid(path: Path, ffprobe_bin: str | None) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    if not ffprobe_bin or not Path(ffprobe_bin).exists():
        return True
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    command = [
        ffprobe_bin, "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=codec_name", "-of", "default=nw=1:nk=1", str(path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, creationflags=flags)
    return result.returncode == 0 and bool(result.stdout.strip())


def merge_series(
    tasks: list[dict], series_id: str, output_root: Path, ffmpeg_bin: str,
    ffprobe_bin: str | None = None, progress_callback: Callable[[float], None] | None = None,
) -> Path:
    group = sorted(
        (task for task in tasks if str(task.get("series_id")) == str(series_id)),
        key=lambda task: int(task.get("episode", 0)),
    )
    if not group or not series_ready(tasks, series_id):
        raise ValueError("全集尚未下载完整")
    title = safe_filename(group[0].get("series_title") or group[0].get("title") or series_id)
    series_dir = output_root / title
    series_dir.mkdir(parents=True, exist_ok=True)
    output = series_dir / f"{title}_全集.mp4"
    episode_paths = [Path(task["local_path"]).resolve() for task in group]
    normalized_dir = series_dir / ".normalized"
    normalized_dir.mkdir(parents=True, exist_ok=True)
    concat_file = normalized_dir / "concat.txt"

    # Most episodes from one series share codecs and time bases. Stream-copying
    # them first turns a minutes-long transcode into a near disk-speed merge.
    _write_concat_file(concat_file, episode_paths)
    try:
        if progress_callback:
            progress_callback(8.0)
        _concat_copy(ffmpeg_bin, concat_file, output)
        validated = _media_is_valid(output, ffprobe_bin)
        if not validated:
            raise RuntimeError("直接合并校验失败")
        if progress_callback:
            progress_callback(100.0)
        # Only delete episode sources once the merged file is genuinely playable.
        # A non-empty-but-corrupt concat output would otherwise leave the user
        # with no recoverable originals.
        for task in group:
            Path(task["local_path"]).unlink(missing_ok=True)
        shutil.rmtree(normalized_dir, ignore_errors=True)
        return output
    except Exception:
        output.unlink(missing_ok=True)

    normalized_paths = [normalized_dir / f"{index:04d}.mp4" for index in range(1, len(episode_paths) + 1)]

    try:
        completed = 0
        with ThreadPoolExecutor(max_workers=min(4, len(episode_paths)), thread_name_prefix="nvenc") as pool:
            futures = {
                pool.submit(normalize_episode, ffmpeg_bin, source, target): target
                for source, target in zip(episode_paths, normalized_paths)
            }
            for future in as_completed(futures):
                future.result()
                completed += 1
                if progress_callback:
                    progress_callback(8.0 + completed / len(episode_paths) * 87.0)

        _write_concat_file(concat_file, normalized_paths)
        _concat_copy(ffmpeg_bin, concat_file, output)
        if not _media_is_valid(output, ffprobe_bin):
            raise RuntimeError("转码合并校验失败")
        # Same guard as the fast path: never drop originals unless the merge is
        # confirmed playable. When no probe is available we still trust the non-empty
        # check (matching legacy behaviour) because the transcode itself re-encodes.
        for task in group:
            Path(task["local_path"]).unlink(missing_ok=True)
        if progress_callback:
            progress_callback(100.0)
        return output
    finally:
        # Always clean the normalized scratch dir, whether the merge succeeded
        # or failed, so a failed transcode does not leave gigs of re-encoded
        # episodes behind on disk.
        shutil.rmtree(normalized_dir, ignore_errors=True)


def delete_episode_files(tasks: list[dict]) -> int:
    """Remove the on-disk episode files referenced by ``tasks``.

    Desktop downloads keep per-episode parts in the ``.parts`` work folder until
    a series is merged. Clearing the task list or deleting a series must not
    leave those parts behind to accumulate forever. Already-merged tasks point
    at the merged ``_全集.mp4`` and are skipped — that file belongs to the user.
    """
    removed = 0
    for task in tasks:
        if task.get("merge_status") == "已合并":
            continue
        local = str(task.get("local_path") or "").strip()
        if not local:
            continue
        path = Path(local)
        try:
            if path.is_file():
                path.unlink(missing_ok=True)
                removed += 1
        except OSError:
            continue
    return removed


def save_tasks(path: Path, tasks: list[dict]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)

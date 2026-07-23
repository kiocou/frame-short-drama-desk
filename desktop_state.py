"""Thread-safe task state helpers shared by the desktop controller and tests."""
import json
from pathlib import Path


def complete_series_merge(tasks: list[dict], series_id: str, output: Path) -> None:
    """Mark every episode in a series as fully merged."""
    output_path = str(output)
    for task in tasks:
        if str(task.get("series_id") or "") != str(series_id):
            continue
        task["merge_status"] = "已合并"
        task["merge_progress"] = 100.0
        task["merged_path"] = output_path
        task["local_path"] = output_path
        task["url"] = output_path
        task["msg"] = "全集合并完成"


def repair_merged_media_paths(tasks: list[dict]) -> bool:
    """Repair records created before merged files replaced episode paths."""
    changed = False
    for task in tasks:
        if task.get("merge_status") != "已合并":
            continue
        candidate = str(task.get("merged_path") or task.get("url") or "").strip()
        if not candidate:
            continue
        path = Path(candidate)
        if not path.is_file():
            continue
        output_path = str(path.resolve())
        for field in ("merged_path", "local_path", "url"):
            if task.get(field) != output_path:
                task[field] = output_path
                changed = True
    return changed


def claim_waiting_tasks(tasks: list[dict], limit: int) -> list[dict]:
    """Reserve up to ``limit`` waiting tasks for the download pool."""
    claimed = []
    for task in tasks:
        if len(claimed) >= max(0, limit):
            break
        if task.get("status") != "等待":
            continue
        task["status"] = "排队中"
        task["msg"] = "等待下载线程"
        claimed.append(task)
    return claimed


def load_task_records(path: Path) -> tuple[list[dict], str]:
    """Load task records without overwriting malformed user data."""
    if not path.exists():
        return [], ""
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return [], f"任务记录读取失败：{exc}"
    if not isinstance(payload, list) or any(not isinstance(item, dict) for item in payload):
        return [], "任务记录格式无效，已使用空任务列表启动"
    for task in payload:
        if task.get("status") in {"下载中", "排队中"}:
            task["status"] = "等待"
            task["msg"] = "上次任务中断，等待继续"
    return payload, ""

type TaskLike = Record<string, unknown>;

const text = (value: unknown): string => String(value ?? "").trim();

const titleForSeries = (task: TaskLike): string => {
  const seriesTitle = text(task.series_title);
  if (seriesTitle) return seriesTitle;
  const rawTitle = text(task.title) || "未命名短剧";
  return rawTitle
    .replace(/\s*第\s*\d+\s*[集话]\s*$/u, "")
    .replace(/\s+(?:EP|Episode)\s*\d+\s*$/iu, "")
    .trim() || rawTitle;
};

const groupKey = (task: TaskLike, index = 0): string => {
  const seriesId = text(task.series_id);
  if (seriesId) return `series:${seriesId}`;
  const sourceUrl = text(task.source_url);
  if (sourceUrl) return `source:${sourceUrl}`;
  const title = titleForSeries(task);
  return title ? `title:${title.toLocaleLowerCase("zh-CN")}` : `task:${text(task.id) || index}`;
};

export const groupedTasks = (tasks: TaskLike[]): TaskLike[] => {
  const groups = new Map<string, TaskLike[]>();
  tasks.forEach((task, index) => {
    const key = groupKey(task, index);
    groups.set(key, [...(groups.get(key) || []), task]);
  });
  return [...groups.entries()].map(([key, items]) => {
    const first = items[0] || {};
    const cover = items.find((item) => text(item.cover_path || item.cover_url || item.cover || item.poster || item.image || item.thumbnail));
    const total = Math.max(items.length, ...items.map((item) => Number(item.episode_total || 0)));
    const failed = items.filter((item) => item.status === "失败").length;
    const completed = items.filter((item) => item.status === "完成" || item.merge_status === "已合并").length;
    const downloading = items.some((item) => item.status === "下载中" || item.status === "排队中");
    const merging = items.some((item) => item.merge_status === "正在合并");
    const merged = items.every((item) => item.merge_status === "已合并");
    const progressEpisode = merged ? total : Math.min(completed, total);
    let message = text(first.msg) || "等待处理";
    if (failed) message = `${failed} 集失败`;
    else if (merged) message = "全集合并完成";
    else if (merging) message = "正在合并全集";
    else if (downloading) message = `${progressEpisode} / ${total} 集已下载`;
    else if (progressEpisode === total) message = "分集下载完成，等待合并";
    return {
      ...first,
      ...(cover || {}),
      _series_key: key,
      _group_size: items.length,
      title: titleForSeries(first),
      series_title: titleForSeries(first),
      episode_total: total,
      episode: progressEpisode,
      status: failed ? "失败" : downloading || merging ? "下载中" : progressEpisode === total ? "完成" : first.status,
      merge_status: merged ? "已合并" : merging ? "正在合并" : first.merge_status,
      msg: message,
    };
  });
};

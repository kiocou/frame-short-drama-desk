type MediaTask = Record<string, unknown>;

const pathText = (value: unknown): string => String(value ?? "").trim();
const mediaFilePattern = /\.(?:mp4|m4v|mov|webm|mkv|avi)(?:$|[?#])/iu;

export const mediaPath = (task: MediaTask): string => {
  const candidates = task.merge_status === "已合并"
    ? [task.merged_path, task.url, task.local_path, task.download_url]
    : [task.local_path, task.url, task.download_url];
  for (const candidate of candidates) {
    const value = pathText(candidate);
    if (!value || /^https?:\/\//iu.test(value) || !mediaFilePattern.test(value)) continue;
    return value;
  }
  return "";
};

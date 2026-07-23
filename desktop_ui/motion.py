"""Small Tk animations designed to avoid sustained redraw work."""


def _ease_out_cubic(value: float) -> float:
    return 1.0 - (1.0 - value) ** 3


def slide_in(widget, distance: int = 12, duration_ms: int = 160) -> None:
    """Reveal a placed widget with a short horizontal easing motion."""
    steps = 8
    interval = max(12, duration_ms // steps)
    token = object()
    widget._motion_token = token

    def render(step: int) -> None:
        if not widget.winfo_exists() or getattr(widget, "_motion_token", None) is not token:
            return
        progress = _ease_out_cubic(step / steps)
        widget.place_configure(x=round(distance * (1.0 - progress)))
        if step < steps:
            widget.after(interval, render, step + 1)

    render(0)


def animate_y(widget, target_y: int, duration_ms: int = 160) -> None:
    """Move a placed indicator without creating an animation thread."""
    start_y = widget.winfo_y()
    if start_y == target_y:
        return
    steps = 8
    interval = max(12, duration_ms // steps)
    token = object()
    widget._motion_token = token

    def render(step: int) -> None:
        if not widget.winfo_exists() or getattr(widget, "_motion_token", None) is not token:
            return
        progress = _ease_out_cubic(step / steps)
        widget.place_configure(y=round(start_y + (target_y - start_y) * progress))
        if step < steps:
            widget.after(interval, render, step + 1)

    render(0)


def animate_progress(widget, value: float, maximum: float = 100.0, duration_ms: int = 180) -> None:
    """Smooth a progress update over a few coalesced main-thread frames."""
    maximum = max(float(maximum), 1.0)
    target = max(0.0, min(float(value), maximum))
    current = float(widget.cget("value") or 0.0)
    widget.configure(maximum=maximum)
    if abs(target - current) < 0.5:
        widget.configure(value=target)
        return
    steps = 7
    interval = max(15, duration_ms // steps)
    token = object()
    widget._progress_token = token

    def render(step: int) -> None:
        if not widget.winfo_exists() or getattr(widget, "_progress_token", None) is not token:
            return
        progress = _ease_out_cubic(step / steps)
        widget.configure(value=current + (target - current) * progress)
        if step < steps:
            widget.after(interval, render, step + 1)

    render(1)


import "./styles.css";
import "./player-fullscreen.js";
(function() {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const n of document.querySelectorAll('link[rel="modulepreload"]')) a(n);
  new MutationObserver((n) => {
    for (const o of n) if (o.type === "childList") for (const c of o.addedNodes) c.tagName === "LINK" && c.rel === "modulepreload" && a(c);
  }).observe(document, { childList: true, subtree: true });
  function i(n) {
    const o = {};
    return n.integrity && (o.integrity = n.integrity), n.referrerPolicy && (o.referrerPolicy = n.referrerPolicy), n.crossOrigin === "use-credentials" ? o.credentials = "include" : n.crossOrigin === "anonymous" ? o.credentials = "omit" : o.credentials = "same-origin", o;
  }
  function a(n) {
    if (n.ep) return;
    n.ep = true;
    const o = i(n);
    fetch(n.href, o);
  }
})();
function be(t, e, i, a) {
  if (typeof e == "function" ? t !== e || !a : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return i === "m" ? a : i === "a" ? a.call(t) : a ? a.value : e.get(t);
}
function fe(t, e, i, a, n) {
  if (typeof e == "function" ? t !== e || true : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(t, i), i;
}
var R;
const _ = "__TAURI_TO_IPC_KEY__";
function _e(t, e = false) {
  return window.__TAURI_INTERNALS__.transformCallback(t, e);
}
async function l(t, e = {}, i) {
  return window.__TAURI_INTERNALS__.invoke(t, e, i);
}
function Se(t, e = "asset") {
  return window.__TAURI_INTERNALS__.convertFileSrc(t, e);
}
class $e {
  get rid() {
    return be(this, R, "f");
  }
  constructor(e) {
    R.set(this, void 0), fe(this, R, e);
  }
  async close() {
    return l("plugin:resources|close", { rid: this.rid });
  }
}
R = /* @__PURE__ */ new WeakMap();
class re {
  constructor(...e) {
    this.type = "Logical", e.length === 1 ? "Logical" in e[0] ? (this.width = e[0].Logical.width, this.height = e[0].Logical.height) : (this.width = e[0].width, this.height = e[0].height) : (this.width = e[0], this.height = e[1]);
  }
  toPhysical(e) {
    return new M(this.width * e, this.height * e);
  }
  [_]() {
    return { width: this.width, height: this.height };
  }
  toJSON() {
    return this[_]();
  }
}
class M {
  constructor(...e) {
    this.type = "Physical", e.length === 1 ? "Physical" in e[0] ? (this.width = e[0].Physical.width, this.height = e[0].Physical.height) : (this.width = e[0].width, this.height = e[0].height) : (this.width = e[0], this.height = e[1]);
  }
  toLogical(e) {
    return new re(this.width / e, this.height / e);
  }
  [_]() {
    return { width: this.width, height: this.height };
  }
  toJSON() {
    return this[_]();
  }
}
class A {
  constructor(e) {
    this.size = e;
  }
  toLogical(e) {
    return this.size instanceof re ? this.size : this.size.toLogical(e);
  }
  toPhysical(e) {
    return this.size instanceof M ? this.size : this.size.toPhysical(e);
  }
  [_]() {
    return { [`${this.size.type}`]: { width: this.size.width, height: this.size.height } };
  }
  toJSON() {
    return this[_]();
  }
}
class oe {
  constructor(...e) {
    this.type = "Logical", e.length === 1 ? "Logical" in e[0] ? (this.x = e[0].Logical.x, this.y = e[0].Logical.y) : (this.x = e[0].x, this.y = e[0].y) : (this.x = e[0], this.y = e[1]);
  }
  toPhysical(e) {
    return new E(this.x * e, this.y * e);
  }
  [_]() {
    return { x: this.x, y: this.y };
  }
  toJSON() {
    return this[_]();
  }
}
class E {
  constructor(...e) {
    this.type = "Physical", e.length === 1 ? "Physical" in e[0] ? (this.x = e[0].Physical.x, this.y = e[0].Physical.y) : (this.x = e[0].x, this.y = e[0].y) : (this.x = e[0], this.y = e[1]);
  }
  toLogical(e) {
    return new oe(this.x / e, this.y / e);
  }
  [_]() {
    return { x: this.x, y: this.y };
  }
  toJSON() {
    return this[_]();
  }
}
class C {
  constructor(e) {
    this.position = e;
  }
  toLogical(e) {
    return this.position instanceof oe ? this.position : this.position.toLogical(e);
  }
  toPhysical(e) {
    return this.position instanceof E ? this.position : this.position.toPhysical(e);
  }
  [_]() {
    return { [`${this.position.type}`]: { x: this.position.x, y: this.position.y } };
  }
  toJSON() {
    return this[_]();
  }
}
var f;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WINDOW_SUSPENDED = "tauri://suspended", t.WINDOW_RESUMED = "tauri://resumed", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(f || (f = {}));
async function ce(t, e) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(t, e), await l("plugin:event|unlisten", { event: t, eventId: e });
}
async function de(t, e, i) {
  var a;
  const n = typeof i?.target == "string" ? { kind: "AnyLabel", label: i.target } : (a = i?.target) !== null && a !== void 0 ? a : { kind: "Any" };
  return l("plugin:event|listen", { event: t, target: n, handler: _e(e) }).then((o) => async () => ce(t, o));
}
async function Ee(t, e, i) {
  return de(t, (a) => {
    ce(t, a.id), e(a);
  }, i);
}
async function xe(t, e) {
  await l("plugin:event|emit", { event: t, payload: e });
}
async function Ne(t, e, i) {
  await l("plugin:event|emit_to", { target: typeof t == "string" ? { kind: "AnyLabel", label: t } : t, event: e, payload: i });
}
class D extends $e {
  constructor(e) {
    super(e);
  }
  static async new(e, i, a) {
    return l("plugin:image|new", { rgba: T(e), width: i, height: a }).then((n) => new D(n));
  }
  static async fromBytes(e) {
    return l("plugin:image|from_bytes", { bytes: T(e) }).then((i) => new D(i));
  }
  static async fromPath(e) {
    return l("plugin:image|from_path", { path: e }).then((i) => new D(i));
  }
  async rgba() {
    return l("plugin:image|rgba", { rid: this.rid }).then((e) => new Uint8Array(e));
  }
  async size() {
    return l("plugin:image|size", { rid: this.rid });
  }
}
function T(t) {
  return t == null ? null : typeof t == "string" ? t : t instanceof D ? t.rid : t;
}
var G;
(function(t) {
  t[t.Critical = 1] = "Critical", t[t.Informational = 2] = "Informational";
})(G || (G = {}));
class Ae {
  constructor(e) {
    this._preventDefault = false, this.event = e.event, this.id = e.id;
  }
  preventDefault() {
    this._preventDefault = true;
  }
  isPreventDefault() {
    return this._preventDefault;
  }
}
var K;
(function(t) {
  t.None = "none", t.Normal = "normal", t.Indeterminate = "indeterminate", t.Paused = "paused", t.Error = "error";
})(K || (K = {}));
function ue() {
  return new pe(window.__TAURI_INTERNALS__.metadata.currentWindow.label, { skip: true });
}
async function V() {
  return l("plugin:window|get_all_windows").then((t) => t.map((e) => new pe(e, { skip: true })));
}
const H = ["tauri://created", "tauri://error"];
class pe {
  constructor(e, i = {}) {
    var a;
    this.label = e, this.listeners = /* @__PURE__ */ Object.create(null), i?.skip || l("plugin:window|create", { options: { ...i, parent: typeof i.parent == "string" ? i.parent : (a = i.parent) === null || a === void 0 ? void 0 : a.label, label: e } }).then(async () => this.emit("tauri://created")).catch(async (n) => this.emit("tauri://error", n));
  }
  static async getByLabel(e) {
    var i;
    return (i = (await V()).find((a) => a.label === e)) !== null && i !== void 0 ? i : null;
  }
  static getCurrent() {
    return ue();
  }
  static async getAll() {
    return V();
  }
  static async getFocusedWindow() {
    for (const e of await V()) if (await e.isFocused()) return e;
    return null;
  }
  async listen(e, i) {
    return this._handleTauriEvent(e, i) ? () => {
      const a = this.listeners[e];
      a.splice(a.indexOf(i), 1);
    } : de(e, i, { target: { kind: "Window", label: this.label } });
  }
  async once(e, i) {
    return this._handleTauriEvent(e, i) ? () => {
      const a = this.listeners[e];
      a.splice(a.indexOf(i), 1);
    } : Ee(e, i, { target: { kind: "Window", label: this.label } });
  }
  async emit(e, i) {
    if (H.includes(e)) {
      for (const a of this.listeners[e] || []) a({ event: e, id: -1, payload: i });
      return;
    }
    return xe(e, i);
  }
  async emitTo(e, i, a) {
    if (H.includes(i)) {
      for (const n of this.listeners[i] || []) n({ event: i, id: -1, payload: a });
      return;
    }
    return Ne(e, i, a);
  }
  _handleTauriEvent(e, i) {
    return H.includes(e) ? (e in this.listeners ? this.listeners[e].push(i) : this.listeners[e] = [i], true) : false;
  }
  async scaleFactor() {
    return l("plugin:window|scale_factor", { label: this.label });
  }
  async innerPosition() {
    return l("plugin:window|inner_position", { label: this.label }).then((e) => new E(e));
  }
  async outerPosition() {
    return l("plugin:window|outer_position", { label: this.label }).then((e) => new E(e));
  }
  async innerSize() {
    return l("plugin:window|inner_size", { label: this.label }).then((e) => new M(e));
  }
  async outerSize() {
    return l("plugin:window|outer_size", { label: this.label }).then((e) => new M(e));
  }
  async isFullscreen() {
    return l("plugin:window|is_fullscreen", { label: this.label });
  }
  async isMinimized() {
    return l("plugin:window|is_minimized", { label: this.label });
  }
  async isMaximized() {
    return l("plugin:window|is_maximized", { label: this.label });
  }
  async isFocused() {
    return l("plugin:window|is_focused", { label: this.label });
  }
  async isDecorated() {
    return l("plugin:window|is_decorated", { label: this.label });
  }
  async isResizable() {
    return l("plugin:window|is_resizable", { label: this.label });
  }
  async isMaximizable() {
    return l("plugin:window|is_maximizable", { label: this.label });
  }
  async isMinimizable() {
    return l("plugin:window|is_minimizable", { label: this.label });
  }
  async isClosable() {
    return l("plugin:window|is_closable", { label: this.label });
  }
  async isVisible() {
    return l("plugin:window|is_visible", { label: this.label });
  }
  async title() {
    return l("plugin:window|title", { label: this.label });
  }
  async theme() {
    return l("plugin:window|theme", { label: this.label });
  }
  async isAlwaysOnTop() {
    return l("plugin:window|is_always_on_top", { label: this.label });
  }
  async activityName() {
    return l("plugin:window|activity_name", { label: this.label });
  }
  async sceneIdentifier() {
    return l("plugin:window|scene_identifier", { label: this.label });
  }
  async center() {
    return l("plugin:window|center", { label: this.label });
  }
  async requestUserAttention(e) {
    let i = null;
    return e && (e === G.Critical ? i = { type: "Critical" } : i = { type: "Informational" }), l("plugin:window|request_user_attention", { label: this.label, value: i });
  }
  async setResizable(e) {
    return l("plugin:window|set_resizable", { label: this.label, value: e });
  }
  async setEnabled(e) {
    return l("plugin:window|set_enabled", { label: this.label, value: e });
  }
  async isEnabled() {
    return l("plugin:window|is_enabled", { label: this.label });
  }
  async setMaximizable(e) {
    return l("plugin:window|set_maximizable", { label: this.label, value: e });
  }
  async setMinimizable(e) {
    return l("plugin:window|set_minimizable", { label: this.label, value: e });
  }
  async setClosable(e) {
    return l("plugin:window|set_closable", { label: this.label, value: e });
  }
  async setTitle(e) {
    return l("plugin:window|set_title", { label: this.label, value: e });
  }
  async maximize() {
    return l("plugin:window|maximize", { label: this.label });
  }
  async unmaximize() {
    return l("plugin:window|unmaximize", { label: this.label });
  }
  async toggleMaximize() {
    return l("plugin:window|toggle_maximize", { label: this.label });
  }
  async minimize() {
    return l("plugin:window|minimize", { label: this.label });
  }
  async unminimize() {
    return l("plugin:window|unminimize", { label: this.label });
  }
  async show() {
    return l("plugin:window|show", { label: this.label });
  }
  async hide() {
    return l("plugin:window|hide", { label: this.label });
  }
  async close() {
    return l("plugin:window|close", { label: this.label });
  }
  async destroy() {
    return l("plugin:window|destroy", { label: this.label });
  }
  async setDecorations(e) {
    return l("plugin:window|set_decorations", { label: this.label, value: e });
  }
  async setShadow(e) {
    return l("plugin:window|set_shadow", { label: this.label, value: e });
  }
  async setEffects(e) {
    return l("plugin:window|set_effects", { label: this.label, value: e });
  }
  async clearEffects() {
    return l("plugin:window|set_effects", { label: this.label, value: null });
  }
  async setAlwaysOnTop(e) {
    return l("plugin:window|set_always_on_top", { label: this.label, value: e });
  }
  async setAlwaysOnBottom(e) {
    return l("plugin:window|set_always_on_bottom", { label: this.label, value: e });
  }
  async setContentProtected(e) {
    return l("plugin:window|set_content_protected", { label: this.label, value: e });
  }
  async setSize(e) {
    return l("plugin:window|set_size", { label: this.label, value: e instanceof A ? e : new A(e) });
  }
  async setMinSize(e) {
    return l("plugin:window|set_min_size", { label: this.label, value: e instanceof A ? e : e ? new A(e) : null });
  }
  async setMaxSize(e) {
    return l("plugin:window|set_max_size", { label: this.label, value: e instanceof A ? e : e ? new A(e) : null });
  }
  async setSizeConstraints(e) {
    function i(a) {
      return a ? { Logical: a } : null;
    }
    return l("plugin:window|set_size_constraints", { label: this.label, value: { minWidth: i(e?.minWidth), minHeight: i(e?.minHeight), maxWidth: i(e?.maxWidth), maxHeight: i(e?.maxHeight) } });
  }
  async setPosition(e) {
    return l("plugin:window|set_position", { label: this.label, value: e instanceof C ? e : new C(e) });
  }
  async setFullscreen(e) {
    return l("plugin:window|set_fullscreen", { label: this.label, value: e });
  }
  async setSimpleFullscreen(e) {
    return l("plugin:window|set_simple_fullscreen", { label: this.label, value: e });
  }
  async setFocus() {
    return l("plugin:window|set_focus", { label: this.label });
  }
  async setFocusable(e) {
    return l("plugin:window|set_focusable", { label: this.label, value: e });
  }
  async setIcon(e) {
    return l("plugin:window|set_icon", { label: this.label, value: T(e) });
  }
  async setSkipTaskbar(e) {
    return l("plugin:window|set_skip_taskbar", { label: this.label, value: e });
  }
  async setCursorGrab(e) {
    return l("plugin:window|set_cursor_grab", { label: this.label, value: e });
  }
  async setCursorVisible(e) {
    return l("plugin:window|set_cursor_visible", { label: this.label, value: e });
  }
  async setCursorIcon(e) {
    return l("plugin:window|set_cursor_icon", { label: this.label, value: e });
  }
  async setBackgroundColor(e) {
    return l("plugin:window|set_background_color", { color: e });
  }
  async setCursorPosition(e) {
    return l("plugin:window|set_cursor_position", { label: this.label, value: e instanceof C ? e : new C(e) });
  }
  async setIgnoreCursorEvents(e) {
    return l("plugin:window|set_ignore_cursor_events", { label: this.label, value: e });
  }
  async startDragging() {
    return l("plugin:window|start_dragging", { label: this.label });
  }
  async startResizeDragging(e) {
    return l("plugin:window|start_resize_dragging", { label: this.label, value: e });
  }
  async setBadgeCount(e) {
    return l("plugin:window|set_badge_count", { label: this.label, value: e });
  }
  async setBadgeLabel(e) {
    return l("plugin:window|set_badge_label", { label: this.label, value: e });
  }
  async setOverlayIcon(e) {
    return l("plugin:window|set_overlay_icon", { label: this.label, value: e ? T(e) : void 0 });
  }
  async setProgressBar(e) {
    return l("plugin:window|set_progress_bar", { label: this.label, value: e });
  }
  async setVisibleOnAllWorkspaces(e) {
    return l("plugin:window|set_visible_on_all_workspaces", { label: this.label, value: e });
  }
  async setTitleBarStyle(e) {
    return l("plugin:window|set_title_bar_style", { label: this.label, value: e });
  }
  async setTheme(e) {
    return l("plugin:window|set_theme", { label: this.label, value: e });
  }
  async onResized(e) {
    return this.listen(f.WINDOW_RESIZED, (i) => {
      i.payload = new M(i.payload), e(i);
    });
  }
  async onMoved(e) {
    return this.listen(f.WINDOW_MOVED, (i) => {
      i.payload = new E(i.payload), e(i);
    });
  }
  async onCloseRequested(e) {
    return this.listen(f.WINDOW_CLOSE_REQUESTED, async (i) => {
      const a = new Ae(i);
      await e(a), a.isPreventDefault() || await this.destroy();
    });
  }
  async onDragDropEvent(e) {
    const i = await this.listen(f.DRAG_ENTER, (c) => {
      e({ ...c, payload: { type: "enter", paths: c.payload.paths, position: new E(c.payload.position) } });
    }), a = await this.listen(f.DRAG_OVER, (c) => {
      e({ ...c, payload: { type: "over", position: new E(c.payload.position) } });
    }), n = await this.listen(f.DRAG_DROP, (c) => {
      e({ ...c, payload: { type: "drop", paths: c.payload.paths, position: new E(c.payload.position) } });
    }), o = await this.listen(f.DRAG_LEAVE, (c) => {
      e({ ...c, payload: { type: "leave" } });
    });
    return () => {
      i(), n(), a(), o();
    };
  }
  async onFocusChanged(e) {
    const i = await this.listen(f.WINDOW_FOCUS, (n) => {
      e({ ...n, payload: true });
    }), a = await this.listen(f.WINDOW_BLUR, (n) => {
      e({ ...n, payload: false });
    });
    return () => {
      i(), a();
    };
  }
  async onScaleChanged(e) {
    return this.listen(f.WINDOW_SCALE_FACTOR_CHANGED, e);
  }
  async onThemeChanged(e) {
    return this.listen(f.WINDOW_THEME_CHANGED, e);
  }
}
var J;
(function(t) {
  t.Disabled = "disabled", t.Throttle = "throttle", t.Suspend = "suspend";
})(J || (J = {}));
var Z;
(function(t) {
  t.Default = "default", t.FluentOverlay = "fluentOverlay";
})(Z || (Z = {}));
var X;
(function(t) {
  t.AppearanceBased = "appearanceBased", t.Light = "light", t.Dark = "dark", t.MediumLight = "mediumLight", t.UltraDark = "ultraDark", t.Titlebar = "titlebar", t.Selection = "selection", t.Menu = "menu", t.Popover = "popover", t.Sidebar = "sidebar", t.HeaderView = "headerView", t.Sheet = "sheet", t.WindowBackground = "windowBackground", t.HudWindow = "hudWindow", t.FullScreenUI = "fullScreenUI", t.Tooltip = "tooltip", t.ContentBackground = "contentBackground", t.UnderWindowBackground = "underWindowBackground", t.UnderPageBackground = "underPageBackground", t.Mica = "mica", t.Blur = "blur", t.Acrylic = "acrylic", t.Tabbed = "tabbed", t.TabbedDark = "tabbedDark", t.TabbedLight = "tabbedLight";
})(X || (X = {}));
var ee;
(function(t) {
  t.FollowsWindowActiveState = "followsWindowActiveState", t.Active = "active", t.Inactive = "inactive";
})(ee || (ee = {}));
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const he = (t, e, i = []) => {
  const a = document.createElementNS("http://www.w3.org/2000/svg", t);
  return Object.keys(e).forEach((n) => {
    a.setAttribute(n, String(e[n]));
  }), i.length && i.forEach((n) => {
    const o = he(...n);
    a.appendChild(o);
  }), a;
};
var ke = ([t, e, i]) => he(t, e, i);
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Le = (t) => Array.from(t.attributes).reduce((e, i) => (e[i.name] = i.value, e), {}), Me = (t) => typeof t == "string" ? t : !t || !t.class ? "" : t.class && typeof t.class == "string" ? t.class.split(" ") : t.class && Array.isArray(t.class) ? t.class : "", De = (t) => t.flatMap(Me).map((i) => i.trim()).filter(Boolean).filter((i, a, n) => n.indexOf(i) === a).join(" "), qe = (t) => t.replace(/(\w)(\w*)(_|-|\s*)/g, (e, i, a) => i.toUpperCase() + a.toLowerCase()), te = (t, { nameAttr: e, icons: i, attrs: a }) => {
  const n = t.getAttribute(e);
  if (n == null) return;
  const o = qe(n), c = i[o];
  if (!c) return console.warn(`${t.outerHTML} icon name was not found in the provided icons object.`);
  const r = Le(t), [u, y, w] = c, g = { ...y, "data-lucide": n, ...a, ...r }, b = De(["lucide", `lucide-${n}`, r, a]);
  b && Object.assign(g, { class: b });
  const p = ke([u, g, w]);
  return t.parentNode?.replaceChild(p, t);
};
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const v = { xmlns: "http://www.w3.org/2000/svg", width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" };
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ie = ["svg", v, [["path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ce = ["svg", v, [["path", { d: "M12 5v14" }], ["path", { d: "m19 12-7 7-7-7" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Oe = ["svg", v, [["path", { d: "M7 7h10v10" }], ["path", { d: "M7 17 17 7" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Re = ["svg", v, [["path", { d: "m5 12 7-7 7 7" }], ["path", { d: "M12 19V5" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Te = ["svg", v, [["path", { d: "M20 6 9 17l-5-5" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const ze = ["svg", v, [["path", { d: "m15 18-6-6 6-6" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const We = ["svg", v, [["path", { d: "m9 18 6-6-6-6" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Pe = ["svg", v, [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "M7 3v18" }], ["path", { d: "M3 7.5h4" }], ["path", { d: "M3 12h18" }], ["path", { d: "M3 16.5h4" }], ["path", { d: "M17 3v18" }], ["path", { d: "M17 7.5h4" }], ["path", { d: "M17 16.5h4" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Fe = ["svg", v, [["path", { d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ue = ["svg", v, [["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }], ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }], ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }], ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }], ["rect", { width: "10", height: "8", x: "7", y: "8", rx: "1" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ve = ["svg", v, [["line", { x1: "22", x2: "2", y1: "12", y2: "12" }], ["path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }], ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16" }], ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const He = ["svg", v, [["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1" }], ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1" }], ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1" }], ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Qe = ["svg", v, [["path", { d: "M11 12H3" }], ["path", { d: "M16 6H3" }], ["path", { d: "M16 18H3" }], ["path", { d: "M18 9v6" }], ["path", { d: "M21 12h-6" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Be = ["svg", v, [["path", { d: "M12 12H3" }], ["path", { d: "M16 6H3" }], ["path", { d: "M12 18H3" }], ["path", { d: "m16 12 5 3-5 3v-6Z" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ge = ["svg", v, [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const je = ["svg", v, [["path", { d: "M5 12h14" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ye = ["svg", v, [["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1" }], ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ke = ["svg", v, [["polygon", { points: "6 3 20 12 6 21 6 3" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Je = ["svg", v, [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Ze = ["svg", v, [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const Xe = ["svg", v, [["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }], ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }], ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }], ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }], ["circle", { cx: "12", cy: "12", r: "3" }], ["path", { d: "m16 16-1.9-1.9" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const et = ["svg", v, [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const tt = ["svg", v, [["line", { x1: "21", x2: "14", y1: "4", y2: "4" }], ["line", { x1: "10", x2: "3", y1: "4", y2: "4" }], ["line", { x1: "21", x2: "12", y1: "12", y2: "12" }], ["line", { x1: "8", x2: "3", y1: "12", y2: "12" }], ["line", { x1: "21", x2: "16", y1: "20", y2: "20" }], ["line", { x1: "12", x2: "3", y1: "20", y2: "20" }], ["line", { x1: "14", x2: "14", y1: "2", y2: "6" }], ["line", { x1: "8", x2: "8", y1: "10", y2: "14" }], ["line", { x1: "16", x2: "16", y1: "18", y2: "22" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const it = ["svg", v, [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const at = ["svg", v, [["path", { d: "M3 6h18" }], ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }], ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }], ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }], ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const st = ["svg", v, [["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }], ["path", { d: "M16 9a5 5 0 0 1 0 6" }], ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const nt = ["svg", v, [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]]];
/**
* @license lucide v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const lt = ({ icons: t = {}, nameAttr: e = "data-lucide", attrs: i = {} } = {}) => {
  if (!Object.values(t).length) throw new Error(`Please provide an icons object.
If you want to use all the icons you can import it like:
 \`import { createIcons, icons } from 'lucide';
lucide.createIcons({icons});\``);
  if (typeof document > "u") throw new Error("`createIcons()` only works in a browser environment.");
  const a = document.querySelectorAll(`[${e}]`);
  if (Array.from(a).forEach((n) => te(n, { nameAttr: e, icons: t, attrs: i })), e === "data-lucide") {
    const n = document.querySelectorAll("[icon-name]");
    n.length > 0 && (console.warn("[Lucide] Some icons were found with the now deprecated icon-name attribute. These will still be replaced for backwards compatibility, but will no longer be supported in v1.0 and you should switch to data-lucide"), Array.from(n).forEach((o) => te(o, { nameAttr: "icon-name", icons: t, attrs: i })));
  }
};
function k(t) {
  return String(t ?? "").trim();
}
function z(t) {
  const e = k(t.series_title);
  if (e) return e;
  const i = k(t.title) || "\u672A\u547D\u540D\u77ED\u5267";
  return i.replace(/\s*第\s*\d+\s*[集话]\s*$/u, "").replace(/\s+(?:EP|Episode)\s*\d+\s*$/iu, "").trim() || i;
}
function j(t, e = 0) {
  const i = k(t.series_id);
  if (i) return `series:${i}`;
  const a = k(t.source_url);
  if (a) return `source:${a}`;
  const n = z(t);
  return n ? `title:${n.toLocaleLowerCase("zh-CN")}` : `task:${k(t.id) || e}`;
}
function x(t) {
  const e = /* @__PURE__ */ new Map();
  return t.forEach((i, a) => {
    const n = j(i, a);
    e.set(n, [...e.get(n) || [], i]);
  }), [...e.entries()].map(([i, a]) => {
    const n = a[0], o = a.find((h) => h.cover_path || h.cover_url || h.cover || h.cover_image || h.poster || h.image || h.thumbnail), c = Math.max(a.length, ...a.map((h) => Number(h.episode_total || 0))), r = a.filter((h) => h.status === "\u5931\u8D25").length, u = a.filter((h) => h.status === "\u5B8C\u6210" || h.merge_status === "\u5DF2\u5408\u5E76").length, y = a.some((h) => ["\u4E0B\u8F7D\u4E2D", "\u6392\u961F\u4E2D"].includes(h.status)), w = a.some((h) => h.merge_status === "\u6B63\u5728\u5408\u5E76"), g = a.every((h) => h.merge_status === "\u5DF2\u5408\u5E76"), b = g ? c : Math.min(u, c);
    let p = k(n.msg) || "\u7B49\u5F85\u5904\u7406";
    return r ? p = `${r} \u96C6\u5931\u8D25` : g ? p = "\u5168\u96C6\u5408\u5E76\u5B8C\u6210" : w ? p = "\u6B63\u5728\u5408\u5E76\u5168\u96C6" : y ? p = `${b} / ${c} \u96C6\u5DF2\u4E0B\u8F7D` : b === c && (p = "\u5206\u96C6\u4E0B\u8F7D\u5B8C\u6210\uFF0C\u7B49\u5F85\u5408\u5E76"), { ...n, ...o || {}, _series_key: i, _group_size: a.length, title: z(n), series_title: z(n), episode_total: c, episode: b, status: r ? "\u5931\u8D25" : y || w ? "\u4E0B\u8F7D\u4E2D" : b === c ? "\u5B8C\u6210" : n.status, merge_status: g ? "\u5DF2\u5408\u5E76" : w ? "\u6B63\u5728\u5408\u5E76" : n.merge_status, msg: p };
  });
}
const rt = /\.(?:mp4|m4v|mov|webm|mkv|avi)(?:$|[?#])/iu;
function ve(t) {
  return String(t ?? "").trim();
}
function ie(t) {
  return ve(t.cover_path || t.cover_url || t.cover || t.cover_image || t.poster || t.image || t.thumbnail);
}
function Q(t) {
  const e = t.merge_status === "\u5DF2\u5408\u5E76" ? [t.merged_path, t.url, t.local_path, t.download_url] : [t.local_path, t.url, t.download_url];
  for (const i of e) {
    const a = ve(i);
    if (!(!a || /^https?:\/\//iu.test(a) || !rt.test(a))) return a;
  }
  return "";
}
function ot(t) {
  const e = /* @__PURE__ */ new Map();
  return t.forEach((i, a) => {
    const n = j(i, a);
    e.set(n, [...e.get(n) || [], i]);
  }), [...e.entries()].flatMap(([i, a]) => {
    const n = [...a].sort((g, b) => Number(g.episode || 0) - Number(b.episode || 0)), o = z(n[0]), c = Math.max(n.length, ...n.map((g) => Number(g.episode_total || 0))), r = ie(n.find((g) => ie(g)) || n[0]), u = n.find((g) => g.merge_status === "\u5DF2\u5408\u5E76" && Q(g));
    if (u) {
      const g = Q(u);
      return [{ key: i, title: o, cover: r, episodeTotal: c, items: [{ key: `${i}:merged`, path: g, title: "\u5168\u96C6\u8FDE\u64AD", episode: 1, episodeTotal: c, merged: true }] }];
    }
    const y = /* @__PURE__ */ new Set(), w = n.flatMap((g, b) => {
      const p = Q(g);
      if (!p || y.has(p) || g.status !== "\u5B8C\u6210") return [];
      y.add(p);
      const h = Number(g.episode || b + 1);
      return [{ key: `${i}:episode:${h}`, path: p, title: `\u7B2C ${h} \u96C6`, episode: h, episodeTotal: c, merged: false }];
    });
    return w.length ? [{ key: i, title: o, cover: r, episodeTotal: c, items: w }] : [];
  });
}
const icSkipBack = ["svg", v, [["polygon", { points: "19 20 9 12 19 4 19 20" }], ["line", { x1: "5", x2: "5", y1: "19", y2: "5" }]]];
const icRewind = ["svg", v, [["polygon", { points: "11 19 2 12 11 5 11 19" }], ["polygon", { points: "22 19 13 12 22 5 22 19" }]]];
const icFastForward = ["svg", v, [["polygon", { points: "13 19 22 12 13 5 13 19" }], ["polygon", { points: "2 19 11 12 2 5 2 19" }]]];
const icSkipForward = ["svg", v, [["polygon", { points: "5 4 15 12 5 20 5 4" }], ["line", { x1: "19", x2: "19", y1: "5", y2: "19" }]]];
const icPanelRight = ["svg", v, [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "M15 3v18" }]]];
const icVolumeX = ["svg", v, [["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }], ["line", { x1: "22", x2: "16", y1: "9", y2: "15" }], ["line", { x1: "16", x2: "22", y1: "9", y2: "15" }]]];
const icVolume1 = ["svg", v, [["path", { d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" }], ["path", { d: "M16 9a5 5 0 0 1 0 6" }]]];
const dt = { Activity: Ie, ArrowUpRight: Oe, Check: Te, ChevronLeft: ze, ChevronRight: We, Film: Pe, FolderOpen: Fe, Fullscreen: Ue, HardDrive: Ve, LayoutDashboard: He, ListVideo: Be, LoaderCircle: Ge, Minus: je, Pause: Ye, Play: Ke, Plus: Je, RotateCcw: Ze, ScanSearch: Xe, ShieldCheck: et, SlidersHorizontal: tt, Square: it, Trash2: at, Volume2: st, Volume1: icVolume1, VolumeX: icVolumeX, SkipBack: icSkipBack, Rewind: icRewind, FastForward: icFastForward, SkipForward: icSkipForward, PanelRight: icPanelRight, X: nt };
const pt = [{ title: "\u711A\u4E5D\u5DDE\u7B2C\u4E94\u5B63", status: "\u5DF2\u5408\u5E76", merge_status: "\u5DF2\u5408\u5E76", episode_total: 110, series_id: "seed-5", progress: "110 / 110 \u96C6", msg: "\u5168\u96C6\u5DF2\u4FDD\u5B58" }, { title: "\u711A\u4E5D\u5DDE\u7B2C\u56DB\u5B63", status: "\u5DF2\u5408\u5E76", merge_status: "\u5DF2\u5408\u5E76", episode_total: 145, series_id: "seed-4", progress: "145 / 145 \u96C6", msg: "\u5168\u96C6\u5DF2\u4FDD\u5B58" }, { title: "\u711A\u4E5D\u5DDE\u7B2C\u4E09\u5B63", status: "\u5DF2\u5408\u5E76", merge_status: "\u5DF2\u5408\u5E76", episode_total: 83, series_id: "seed-3", progress: "83 / 83 \u96C6", msg: "\u5168\u96C6\u5DF2\u4FDD\u5B58" }], s = { view: "home", tasks: [], search: [], snapshot: { config: {}, output_dir: "", running: false }, starting: false, searching: false, searchVersion: 0, keyword: "\u7A7F\u8D8A", source: "\u7EA2\u679C\u77ED\u5267", category: "\u7A7F\u8D8A", page: "1", notice: "", activeSeries: "", activeEpisode: 0, autoplay: false, detailSeries: "", playerFullscreen: false, playerPanelOpen: false, playbackSpeed: 1 };
function syncPlayerFullscreenClass() {
  document.body.classList.toggle("player-fullscreen", s.playerFullscreen && s.view === "player");
}
async function setNativePlayerFullscreen(fullscreen) {
  if (!window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label) return;
  try {
    await ue().setFullscreen(fullscreen);
  } catch (e) {
    console.warn("Native window fullscreen unavailable", e);
  }
}
function revealActivePanelEpisode() {
  requestAnimationFrame(() => {
    const list = document.querySelector(".episode-strip"), active = list?.querySelector("button.active");
    if (!list || !active) return;
    const listBounds = list.getBoundingClientRect(), activeBounds = active.getBoundingClientRect();
    list.scrollTop += activeBounds.top - listBounds.top - (list.clientHeight - activeBounds.height) / 2;
  });
}
async function setPlayerFullscreen(t) {
  const shouldEnter = !!t, frame = document.querySelector(".video-frame");
  if (shouldEnter) {
    if (!document.fullscreenElement && frame?.requestFullscreen) {
      try {
        await frame.requestFullscreen();
      } catch (e) {
        console.warn("Element fullscreen unavailable, using window fullscreen", e);
      }
    }
    s.playerFullscreen = true, syncPlayerFullscreenClass();
    await setNativePlayerFullscreen(true);
    s.playerPanelOpen && revealActivePanelEpisode();
    return;
  }
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (e) {
      console.warn(e);
    }
  }
  await setNativePlayerFullscreen(false);
  s.playerFullscreen = false, syncPlayerFullscreenClass();
}
// Hide the webview's default right-click context menu everywhere. This is a
// desktop workspace, not a web page, so the browser menu (back/reload/view
// source) is noise. Ctrl+C / Ctrl+V keyboard shortcuts are unaffected —
// preventDefault on "contextmenu" only suppresses the menu popup itself.
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    s.playerFullscreen = true;
    s.playerPanelOpen && revealActivePanelEpisode();
  } else if (s.playerFullscreen) {
    s.playerFullscreen = false;
    setNativePlayerFullscreen(false);
  }
  syncPlayerFullscreenClass();
});
function L() {
  return ot(s.tasks);
}
function ye(t) {
  if (/^(?:https?:|data:|blob:|asset:)/iu.test(t)) return t;
  try {
    return Se(t);
  } catch {
    return `file:///${t.replace(/\\/g, "/")}`;
  }
}
async function S(t, e = {}) {
  try {
    return await l("bridge", { action: t, payload: e });
  } catch (i) {
    return console.warn(`[bridge:${t}]`, i), null;
  }
}
async function ht(t) {
  try {
    await l("open_folder", { path: t });
  } catch (e) {
    console.warn(e);
  }
}
async function $(t = true) {
  const e = await S("snapshot");
  e ? (s.snapshot = e, s.tasks = e.tasks ?? []) : s.tasks.length || (s.tasks = pt), s.activeSeries && !L().some((n) => n.key === s.activeSeries) && (s.activeSeries = "", s.activeEpisode = 0), s.detailSeries && !x(s.tasks).some((n) => n._series_key === s.detailSeries) && (s.detailSeries = "");
  const i = document.querySelectorAll(".queue-row").length !== (s.view === "tasks" ? x(s.tasks).length : 0), a = s.view === "player" && document.querySelectorAll(".media-card").length !== L().length;
  t || i || a ? m() : vt();
}
function P(t) {
  return t.merge_status === "\u5DF2\u5408\u5E76" ? "\u5DF2\u5408\u5E76" : t.merge_status === "\u6B63\u5728\u5408\u5E76" ? "\u5408\u5E76\u4E2D" : t.status === "\u5B8C\u6210" ? "\u5DF2\u4E0B\u8F7D" : t.status === "\u4E0B\u8F7D\u4E2D" || t.status === "\u6392\u961F\u4E2D" ? "\u8FDB\u884C\u4E2D" : t.status === "\u5931\u8D25" ? "\u5931\u8D25" : "\u7B49\u5F85\u4E2D";
}
function Y(t) {
  return t.merge_status === "\u5DF2\u5408\u5E76" ? t.episode_total ? `${t.episode_total} / ${t.episode_total} \u96C6` : "\u5168\u96C6\u5DF2\u5408\u5E76" : t.merge_status === "\u6B63\u5728\u5408\u5E76" ? `\u5408\u5E76 ${Math.round(Number(t.merge_progress || 0))}%` : t._group_size ? `${t.episode || 0} / ${t.episode_total || t._group_size} \u96C6` : t.episode_total ? `\u7B2C ${t.episode || 1} / ${t.episode_total} \u96C6` : t.status === "\u5B8C\u6210" ? "100%" : "\u2014";
}
function ge(t) {
  const e = P(t);
  return e === "\u5931\u8D25" ? "danger" : e === "\u8FDB\u884C\u4E2D" || e === "\u5408\u5E76\u4E2D" ? "working" : e === "\u5DF2\u4E0B\u8F7D" || e === "\u5DF2\u5408\u5E76" ? "done" : "waiting";
}
function vt() {
  const t = document.querySelector(".engine-pill");
  if (t) {
    t.classList.toggle("active", s.snapshot.running || s.starting);
    const a = t.lastChild;
    a?.nodeType === Node.TEXT_NODE && (a.textContent = s.starting ? "ENGINE STARTING" : s.snapshot.running ? "ENGINE RUNNING" : "ENGINE READY");
  }
  const e = document.querySelector(".sidebar-foot b");
  e && (e.textContent = s.starting ? "\u4E0B\u8F7D\u5F15\u64CE\u542F\u52A8\u4E2D" : s.snapshot.running ? "\u4E0B\u8F7D\u5F15\u64CE\u8FD0\u884C\u4E2D" : "\u5F15\u64CE\u5DF2\u5C31\u7EEA");
  const start = document.querySelector('[data-action="start"]');
  if (start) {
    const state = s.starting ? "starting" : s.snapshot.running ? "running" : "ready";
    if (start.dataset.state !== state) {
      start.dataset.state = state;
      start.disabled = state !== "ready";
      start.setAttribute("aria-busy", String(state === "starting"));
      start.innerHTML = state === "starting" ? '<i class="spin" data-lucide="loader-circle"></i>\u542F\u52A8\u4E2D' : state === "running" ? '<i data-lucide="activity"></i>\u8FD0\u884C\u4E2D' : '<i data-lucide="play"></i>\u5F00\u59CB';
      lt({ icons: dt });
    }
  }
  const i = x(s.tasks);
  document.querySelectorAll(".queue-row[data-series-key]").forEach((a) => {
    const n = i.find((u) => u._series_key === a.dataset.seriesKey);
    if (!n) return;
    const o = a.querySelector(".status");
    o && (o.className = `status ${ge(n)}`, o.innerHTML = `<i></i>${P(n)}`);
    const c = a.querySelector(".progress-copy");
    c && (c.textContent = Y(n));
    const r = a.querySelector(".queue-message");
    r && (r.textContent = String(n.msg || "\u7B49\u5F85\u5904\u7406"));
  }), bt();
}
function yt(t) {
  return x(t).slice(-6).reverse();
}
function O(t, e, i, a = "") {
  return `<div class="metric ${a}"><span>${t}</span><strong>${e}</strong><small>${i}</small></div>`;
}
function d(t) {
  return String(t ?? "").replace(/[&<>"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e] || e);
}
function we(t) {
  const e = t.cover_path || t.cover_url || t.cover || t.cover_image || t.poster || t.image || t.thumbnail || "", i = String(e).trim();
  return i ? i.startsWith("//") ? `https:${i}` : ye(i) : "";
}
function I(t, e = 0) {
  const i = String(t.series_title || t.title || "\u5267"), a = we(t);
  return `<span class="poster poster-${e % 4}${a ? " has-cover" : ""}${t._cover_loading ? " is-cover-loading" : ""}">
    <span class="poster-fallback">${d(i.slice(0, 1))}</span>
    ${a ? `<img src="${d(a)}" alt="${d(i)}\u5C01\u9762" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ""}
  </span>`;
}
async function gt(t, e) {
  const i = e.filter((r) => !String(r.cover_path || "").trim());
  if (!i.length) return;
  const a = await S("hydrate-covers", { items: i.map((r) => ({ drama_id: r.drama_id, source_url: r.source_url, cover_url: r.cover_url })) });
  if (!a || t !== s.searchVersion) return;
  const n = new Map(a.items.map((r) => [String(r.drama_id || ""), r]));
  if (s.search = s.search.map((r) => {
    const u = n.get(String(r.drama_id || ""));
    return u ? { ...r, cover_url: u.cover_url || r.cover_url, cover_path: u.cover_path || "", _cover_loading: false } : { ...r, _cover_loading: false };
  }), s.view !== "search") return;
  const o = document.querySelector(".content")?.scrollTop || 0;
  m();
  const c = document.querySelector(".content");
  c && (c.scrollTop = o);
}
function wt(t) {
  return s.tasks.map((e, i) => ({ task: e, key: j(e, i) })).filter((e) => e.key === t).map((e) => e.task).sort((e, i) => Number(e.episode || 0) - Number(i.episode || 0));
}
function ae(t) {
  return t.merge_status === "\u5DF2\u5408\u5E76" ? { label: "\u5DF2\u5B8C\u6210", tone: "done" } : t.status === "\u5B8C\u6210" ? { label: "\u5DF2\u4E0B\u8F7D", tone: "done" } : t.status === "\u5931\u8D25" ? { label: "\u5931\u8D25", tone: "danger" } : ["\u4E0B\u8F7D\u4E2D", "\u6392\u961F\u4E2D"].includes(t.status) ? { label: t.status, tone: "working" } : { label: "\u7B49\u5F85\u4E2D", tone: "waiting" };
}
function me(t) {
  const e = wt(t), i = x(s.tasks).find((p) => p._series_key === t);
  if (!i || !e.length) return "";
  const a = Math.max(e.length, Number(i.episode_total || 0)), n = e.filter((p) => p.status === "\u5B8C\u6210" || p.merge_status === "\u5DF2\u5408\u5E76").length, o = e.filter((p) => ["\u4E0B\u8F7D\u4E2D", "\u6392\u961F\u4E2D"].includes(p.status)).length, c = e.filter((p) => p.status === "\u5931\u8D25").length, r = Math.max(0, a - n - o - c), u = a ? Math.round(n / a * 100) : 0, y = Math.max(0, ...e.map((p) => Number(p.merge_progress || 0))), w = Array.from({ length: a }, (p, h) => {
    const N = e.find((U) => Number(U.episode || 0) === h + 1);
    return `<i class="${N ? ae(N).tone : "waiting"}" title="\u7B2C ${h + 1} \u96C6"></i>`;
  }).join(""), g = e.map((p, h) => {
    const N = ae(p), F = Number(p.episode || h + 1), U = N.tone === "done" ? "100%" : N.tone === "working" ? "\u5904\u7406\u4E2D" : "\u2014";
    return `<div class="episode-detail-row" data-episode-id="${d(p.id || F)}"><span class="episode-number">${String(F).padStart(2, "0")}</span><span class="episode-state ${N.tone}"><i></i>${N.label}</span><span class="episode-detail-message">${d(p.msg || "\u7B49\u5F85\u5904\u7406")}</span><span class="episode-percent">${U}</span></div>`;
  }).join(""), b = i.merge_status === "\u6B63\u5728\u5408\u5E76" ? `\u6B63\u5728\u5408\u5E76\u5168\u96C6 \xB7 ${Math.round(y)}%` : i.merge_status === "\u5DF2\u5408\u5E76" ? "\u5168\u96C6\u5DF2\u5408\u5E76" : n === a ? "\u5206\u96C6\u4E0B\u8F7D\u5B8C\u6210" : "\u5206\u96C6\u4E0B\u8F7D\u4E2D";
  return `<section class="detail-progress"><div class="detail-progress-copy"><div><span>DOWNLOAD PROGRESS</span><b>${n} / ${a} \u96C6</b></div><strong>${u}%</strong></div><div class="detail-progress-track"><i style="width:${u}%"></i></div><small>${b}</small></section><section class="detail-metrics"><div><span>\u5DF2\u5B8C\u6210</span><b>${n}</b></div><div><span>\u8FDB\u884C\u4E2D</span><b>${o}</b></div><div><span>\u7B49\u5F85</span><b>${r}</b></div><div class="${c ? "danger" : ""}"><span>\u5931\u8D25</span><b>${c}</b></div></section><div class="episode-map" aria-label="\u5206\u96C6\u72B6\u6001\u56FE">${w}</div><section class="episode-detail"><div class="episode-detail-head"><span>\u96C6\u6570</span><span>\u72B6\u6001</span><span>\u8BF4\u660E</span><span>\u8FDB\u5EA6</span></div><div class="episode-detail-list">${g}</div></section>`;
}
function mt() {
  if (!s.detailSeries) return "";
  const t = x(s.tasks).find((e) => e._series_key === s.detailSeries);
  return t ? `<div class="task-detail-backdrop" data-close-task-detail><aside class="task-detail-drawer" role="dialog" aria-modal="true" aria-label="\u300A${d(t.title)}\u300B\u4E0B\u8F7D\u8BE6\u60C5"><header class="task-detail-header">${I(t, 0)}<div><span class="eyebrow">SERIES DOWNLOAD</span><h2>${d(t.title)}</h2><small>${d(t.series_id || t.id || "\u672C\u5730\u4EFB\u52A1")} \xB7 \u5171 ${d(t.episode_total || t._group_size)} \u96C6</small></div><button data-close-task-detail aria-label="\u5173\u95ED\u8BE6\u60C5"><i data-lucide="x"></i></button></header><div class="task-detail-live">${me(s.detailSeries)}</div></aside></div>` : "";
}
function bt() {
  if (!s.detailSeries) return;
  const t = document.querySelector(".task-detail-live");
  if (!t) return;
  const i = t.querySelector(".episode-detail-list")?.scrollTop || 0;
  t.innerHTML = me(s.detailSeries);
  const a = t.querySelector(".episode-detail-list");
  a && (a.scrollTop = i);
}
function ft(t) {
  return `<main class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">F</div><div><b>FRAME</b><small>SHORT DRAMA DESK</small></div></div>
      <nav class="nav-list">${[["home", "layout-dashboard", "\u5DE5\u4F5C\u53F0", "01"], ["search", "scan-search", "\u7247\u5E93\u641C\u7D22", "02"], ["tasks", "list-video", "\u4E0B\u8F7D\u961F\u5217", "03"], ["player", "film", "\u672C\u5730\u64AD\u653E", "04"], ["settings", "sliders-horizontal", "\u7CFB\u7EDF\u8BBE\u7F6E", "05"]].map(([i, a, n, o]) => `<button class="nav-item ${s.view === i ? "active" : ""}" data-view="${i}"><i data-lucide="${a}"></i><span>${n}</span><em>${o}</em></button>`).join("")}</nav>
      <div class="sidebar-foot"><span class="live-dot"></span><div><b>${s.snapshot.running ? "\u4E0B\u8F7D\u5F15\u64CE\u8FD0\u884C\u4E2D" : "\u5F15\u64CE\u5DF2\u5C31\u7EEA"}</b><small>FFmpeg / local pipeline</small></div></div>
    </aside>
    <section class="workspace">
      <header class="titlebar" data-tauri-drag-region><div class="crumb">FRAME <span>/</span> ${s.view === "home" ? "WORKSPACE" : s.view.toUpperCase()}</div><div class="window-actions"><button data-window="minimize" aria-label="\u6700\u5C0F\u5316"><i data-lucide="minus"></i></button><button data-window="maximize" aria-label="\u6700\u5927\u5316"><i data-lucide="square"></i></button><button data-window="close" aria-label="\u5173\u95ED"><i data-lucide="x"></i></button></div></header>
      <div class="content ${s.view === "player" ? "player-content" : ""}">${t}</div>
    </section>
  </main>`;
}
function _t() {
  const t = x(s.tasks), e = t.filter((o) => o.merge_status === "\u5DF2\u5408\u5E76" || o.status === "\u5B8C\u6210").length, i = t.filter((o) => ["\u4E0B\u8F7D\u4E2D", "\u6392\u961F\u4E2D", "\u7B49\u5F85"].includes(o.status)).length, a = t.filter((o) => o.status === "\u5931\u8D25").length, n = yt(t);
  return `<div class="view home-view">
    <div class="view-intro reveal"><div><span class="eyebrow">TODAY'S CUT / 01</span><h1>\u628A\u65F6\u95F4\u7559\u7ED9<br /><i>\u597D\u6545\u4E8B\u3002</i></h1><p>\u4ECE\u53D1\u73B0\u4E00\u90E8\u77ED\u5267\uFF0C\u5230\u62FF\u5230\u5B8C\u6574\u6210\u7247\uFF0C\u6240\u6709\u6B65\u9AA4\u5728\u4E00\u5F20\u5DE5\u4F5C\u53F0\u5B8C\u6210\u3002</p></div><div class="intro-stamp"><span>LOCAL<br />MEDIA<br />DESK</span><b>2026</b></div></div>
    <section class="launch-grid reveal delay-1"><article class="launch-card search-launch"><div class="launch-label"><span>A</span><div><b>\u7247\u5E93\u68C0\u7D22</b><small>\u6309\u5267\u540D\u3001\u7C7B\u578B\u6216\u6765\u6E90\u53D1\u73B0\u65B0\u7247</small></div></div><div class="inline-form"><input id="home-keyword" value="${s.keyword}" placeholder="\u8F93\u5165\u5267\u540D\u6216\u5173\u952E\u8BCD" /><button class="signal" data-action="search"><i data-lucide="arrow-up-right"></i>\u5F00\u59CB\u641C\u7D22</button></div></article><article class="launch-card queue-launch"><div class="launch-label"><span>B</span><div><b>\u5FEB\u901F\u5165\u961F</b><small>\u7C98\u8D34\u5206\u4EAB\u94FE\u63A5\u6216\u591A\u4E2A\u77ED\u5267 ID</small></div></div><div class="inline-form"><input id="home-raw" placeholder="https://... \u6216 12345, 67890" /><button class="ink" data-action="enqueue"><i data-lucide="plus"></i>\u52A0\u5165\u961F\u5217</button></div></article></section>
    <section class="metric-row reveal delay-2">${O("\u5168\u90E8\u4EFB\u52A1", String(t.length), "\u672C\u5730\u8BB0\u5F55")}${O("\u5DF2\u5B8C\u6210", String(e), "\u5206\u96C6\u6216\u5168\u96C6", "green")}${O("\u8FDB\u884C\u4E2D", String(i), "\u7B49\u5F85\u5904\u7406", "blue")}${O("\u9700\u5173\u6CE8", String(a), "\u5931\u8D25\u4EFB\u52A1", a ? "red" : "")}</section>
    <section class="section-block reveal delay-3"><div class="section-head"><div><span class="eyebrow">RECENT ACTIVITY</span><h2>\u6700\u8FD1\u4EFB\u52A1</h2></div><button class="text-button" data-view="tasks">\u67E5\u770B\u961F\u5217 <i data-lucide="arrow-up-right"></i></button></div><div class="task-table compact"><div class="table-head"><span>\u5267\u96C6</span><span>\u72B6\u6001</span><span>\u8FDB\u5EA6</span></div>${n.length ? n.map(St).join("") : '<div class="empty-state"><i data-lucide="film"></i><p>\u8FD8\u6CA1\u6709\u4EFB\u52A1\uFF0C\u4ECE\u4E0A\u65B9\u641C\u7D22\u6216\u7C98\u8D34\u94FE\u63A5\u5F00\u59CB\u3002</p></div>'}</div></section>
  </div>`;
}
function St(t, e = 0) {
  const i = P(t), a = i === "\u5931\u8D25" ? "danger" : i === "\u8FDB\u884C\u4E2D" || i === "\u5408\u5E76\u4E2D" ? "working" : i === "\u5DF2\u5408\u5E76" || i === "\u5DF2\u4E0B\u8F7D" ? "done" : "waiting";
  return `<div class="table-row" data-task-index="${e}"><div class="title-cell">${I(t, e)}<div><b>${d(t.title || "\u672A\u547D\u540D\u77ED\u5267")}</b><small>${d(t.series_title || t.id || "\u672C\u5730\u4EFB\u52A1")}</small></div></div><span class="status ${a}"><i></i>${i}</span><span class="progress-copy">${Y(t)}</span></div>`;
}
function $t() {
  const t = s.searching ? '<div class="search-loading" role="status" aria-live="polite"><i class="spin" data-lucide="loader-circle"></i><b>\u6B63\u5728\u641C\u7D22\u7247\u5E93</b><span>\u6B63\u5728\u540C\u6B65\u516C\u5F00\u6765\u6E90\u2026</span><div class="loading-track" aria-hidden="true"><i></i></div></div>' : s.search.length ? `<div class="result-grid">${s.search.map((e, i) => `<button class="result-card" data-result-index="${i}"><div class="result-card-cover">${I(e, i)}${e.episodes ? `<span class="result-ep-badge">${d(e.episodes)}</span>` : ""}</div><div class="result-card-body"><b class="result-card-title">${d(e.title || "\u672A\u547D\u540D")}</b><span class="result-card-meta">${d(e.category || e.source || e.author || "")}</span></div><span class="result-card-add" aria-label="\u52A0\u5165\u961F\u5217"><i data-lucide="plus"></i></span></button>`).join("")}</div>` : '<div class="empty-state large"><i data-lucide="scan-search"></i><p>\u8F93\u5165\u6761\u4EF6\u5F00\u59CB\u68C0\u7D22\u3002\u7ED3\u679C\u4F1A\u5728\u8FD9\u91CC\u6309\u6765\u6E90\u5206\u7EC4\u5448\u73B0\u3002</p></div>';
  return `<div class="view search-view"><div class="page-head reveal"><div><span class="eyebrow">LIBRARY / 02</span><h1>\u7247\u5E93\u641C\u7D22</h1><p>\u805A\u5408\u516C\u5F00\u6765\u6E90\uFF0C\u9009\u62E9\u4E00\u6761\u7ED3\u679C\u540E\u5373\u53EF\u89E3\u6790\u5168\u96C6\u3002</p></div><span class="head-note">${s.searching ? "SYNCING SOURCES" : `${s.search.length} RESULTS`}</span></div><section class="filter-bar reveal delay-1"><label>\u5173\u952E\u8BCD<input id="search-keyword" value="${d(s.keyword)}" /></label><label>\u6765\u6E90<select id="search-source"><option>\u7EA2\u679C\u77ED\u5267</option><option>\u7EA2\u679C\u6F2B\u5267</option><option>\u7231\u5947\u827A\u77ED\u5267</option><option>\u5168\u7F51\u805A\u5408</option></select></label><label>\u5206\u7C7B<input id="search-category" value="${d(s.category)}" /></label><label>\u9875\u7801<input id="search-page" value="${d(s.page)}" /></label><button class="signal ${s.searching ? "is-loading" : ""}" data-action="search" ${s.searching ? "disabled" : ""}><i class="${s.searching ? "spin" : ""}" data-lucide="${s.searching ? "loader-circle" : "scan-search"}"></i>${s.searching ? "\u641C\u7D22\u4E2D" : "\u5F00\u59CB\u641C\u7D22"}</button></section><section class="result-panel search-results reveal delay-2">${t}</section></div>`;
}
function Et() {
  const t = s.tasks.filter((a) => a.status === "\u5931\u8D25").length, e = x(s.tasks), i = e.map((a, n) => `<div class="queue-row" data-series-key="${d(a._series_key)}" tabindex="0" title="\u67E5\u770B\u300A${d(a.title)}\u300B\u4E0B\u8F7D\u8BE6\u60C5">
    <span class="title-cell">${I(a, n)}<div><b>${d(a.title || "\u672A\u547D\u540D")}</b><small>\u5171 ${d(a.episode_total || a._group_size)} \u96C6 \xB7 ${d(a.series_id || a.id || "\u672C\u5730\u4EFB\u52A1")}</small></div></span>
    <span class="status ${ge(a)}"><i></i>${P(a)}</span>
    <span class="progress-copy">${Y(a)}</span>
    <span class="queue-message">${d(a.msg || "\u7B49\u5F85\u5904\u7406")}</span>
    <button class="delete-series" data-delete-series data-series-key="${d(a._series_key)}" data-series-title="${d(a.title)}" aria-label="\u5220\u9664\u300A${d(a.title)}\u300B" title="\u4ECE\u961F\u5217\u5220\u9664\uFF0C\u4E0D\u5220\u9664\u672C\u5730\u6587\u4EF6" ${s.snapshot.running ? "disabled" : ""}><i data-lucide="trash-2"></i></button>
  </div>`).join("");
  const startState = s.starting ? "starting" : s.snapshot.running ? "running" : "ready", engineState = s.starting ? "ENGINE STARTING" : s.snapshot.running ? "ENGINE RUNNING" : "ENGINE READY";
  const startContent = startState === "starting" ? '<i class="spin" data-lucide="loader-circle"></i>\u542F\u52A8\u4E2D' : startState === "running" ? '<i data-lucide="activity"></i>\u8FD0\u884C\u4E2D' : '<i data-lucide="play"></i>\u5F00\u59CB';
  return `<div class="view"><div class="page-head reveal"><div><span class="eyebrow">QUEUE / 03</span><h1>\u4E0B\u8F7D\u961F\u5217</h1><p>\u5E76\u53D1\u4E0B\u8F7D\u3001\u5931\u8D25\u91CD\u8BD5\u4E0E\u5168\u96C6\u5408\u5E76\u90FD\u5728\u8FD9\u91CC\u5B8C\u6210\u3002</p></div><div class="engine-pill ${s.snapshot.running || s.starting ? "active" : ""}"><i data-lucide="activity"></i>${engineState}</div></div><section class="queue-toolbar reveal delay-1"><div class="inline-form"><input id="queue-raw" placeholder="\u7C98\u8D34\u5206\u4EAB\u94FE\u63A5\u6216\u77ED\u5267 ID" /><button class="ink" data-action="enqueue"><i data-lucide="plus"></i>\u52A0\u5165\u961F\u5217</button></div><div class="toolbar-actions"><button class="signal" data-action="start" data-state="${startState}" aria-busy="${s.starting}" ${startState !== "ready" ? "disabled" : ""}>${startContent}</button><button data-action="pause"><i data-lucide="pause"></i>\u6682\u505C</button><button data-action="retry"><i data-lucide="rotate-ccw"></i>\u91CD\u8BD5\u5931\u8D25${t ? ` (${t})` : ""}</button><button class="ghost" data-action="open-output"><i data-lucide="folder-open"></i>\u6253\u5F00\u76EE\u5F55</button></div></section><section class="result-panel queue-panel reveal delay-2"><div class="table-head queue-head"><span>\u77ED\u5267</span><span>\u72B6\u6001</span><span>\u8FDB\u5EA6</span><span>\u8BF4\u660E</span><span></span></div>${e.length ? i : '<div class="empty-state large"><i data-lucide="list-video"></i><p>\u961F\u5217\u4E3A\u7A7A\u3002\u628A\u7B2C\u4E00\u90E8\u77ED\u5267\u653E\u8FDB\u6765\u3002</p></div>'}</section></div>${mt()}`;
}
function W(t, e = 0, i = true) {
  const n = L().find((o) => o.key === t);
  n && (s.activeSeries = t, s.activeEpisode = Math.max(0, Math.min(e, n.items.length - 1)), s.autoplay = i, s.view = "player", m());
}
function B(t, e = true) {
  const i = L(), a = i.find((u) => u.key === s.activeSeries);
  if (!a) return;
  const n = s.activeEpisode + t;
  if (n >= 0 && n < a.items.length) {
    if (s.playerFullscreen && playEpisodeInline(a.key, n, e)) return;
    W(a.key, n, e);
    return;
  }
  const o = i.findIndex((u) => u.key === a.key), r = i[o + t];
  if (!r) return;
  const targetEpisode = t > 0 ? 0 : r.items.length - 1;
  if (s.playerFullscreen && playEpisodeInline(r.key, targetEpisode, e)) return;
  W(r.key, targetEpisode, e);
}
function episodeSection(series) {
  if (!series || series.items.length <= 1) return "";
  return `<section class="side-episodes"><div class="player-tabs episode-title"><div><b>\u9009\u96C6</b><small>${d(series.title)}</small></div><span class="section-count">${series.items.length}</span></div><div class="episode-strip" aria-label="\u9009\u96C6">${series.items.map((item, index) => `<button class="${index === s.activeEpisode ? "active" : ""}" data-player-action="play-episode" data-series-key="${d(series.key)}" data-episode-index="${index}" aria-label="\u64AD\u653E\u7B2C ${item.episode} \u96C6">${item.episode}</button>`).join("")}</div></section>`;
}
function syncInlineSeries(series) {
  document.querySelectorAll(".media-card").forEach((card) => {
    const active = card.dataset.seriesKey === series.key;
    card.classList.toggle("active", active);
    card.setAttribute("aria-current", active ? "true" : "false");
    const status = card.querySelector("small");
    if (status) {
      const defaultLabel = status.dataset.defaultLabel || status.textContent;
      status.textContent = active ? `\u6B63\u5728\u64AD\u653E \xB7 ${defaultLabel}` : defaultLabel;
    }
  });
  const current = document.querySelector(".side-episodes"), html = episodeSection(series);
  if (!html) {
    current?.remove();
    return;
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  const replacement = template.content.firstElementChild;
  if (!replacement) return;
  current ? current.replaceWith(replacement) : document.querySelector(".media-library")?.after(replacement);
}
function playEpisodeInline(seriesKey, episodeIndex, autoplay = true) {
  const series = L().find((entry) => entry.key === seriesKey), video = document.querySelector("#player-video");
  if (!series || !video) return false;
  const index = Math.max(0, Math.min(episodeIndex, series.items.length - 1)), item = series.items[index];
  if (!item) return false;
  const seriesChanged = s.activeSeries !== seriesKey;
  s.activeSeries = seriesKey, s.activeEpisode = index, s.autoplay = false;
  if (seriesChanged) syncInlineSeries(series);
  video.pause();
  video.src = ye(item.path);
  video.load();
  video.playbackRate = s.playbackSpeed || 1;
  document.querySelectorAll('[data-player-action="play-episode"]').forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.episodeIndex) === index);
  });
  revealActivePanelEpisode();
  const overlay = document.querySelector(".now-playing"), meta = document.querySelector(".player-meta");
  const overlayEpisode = overlay?.querySelector("span"), overlayTitle = overlay?.querySelector("b"), overlayItem = overlay?.querySelector("small");
  if (overlayEpisode) overlayEpisode.textContent = item.merged ? "FEATURE CUT" : `EPISODE ${item.episode}`;
  if (overlayTitle) overlayTitle.textContent = series.title;
  if (overlayItem) overlayItem.textContent = item.title;
  const metaTitle = meta?.querySelector("h2"), metaEpisode = meta?.querySelector(":scope > span");
  if (metaTitle) metaTitle.textContent = series.title;
  if (metaEpisode) metaEpisode.textContent = item.merged ? `\u5168\u96C6 \u00B7 ${item.episodeTotal} \u96C6` : `\u7B2C ${item.episode} / ${item.episodeTotal} \u96C6`;
  const error = document.querySelector(".player-error"), time = document.querySelector("#player-time");
  if (error) error.textContent = "";
  if (time) time.textContent = "00:00 / 00:00";
  if (autoplay) video.play().catch(() => {});
  return true;
}
function Nt() {
  const t = L();
  !s.activeSeries && t.length && (s.activeSeries = t[0].key);
  const i = t.find((series) => series.key === s.activeSeries) || t[0];
  const a = i?.items[Math.min(s.activeEpisode, Math.max(0, i.items.length - 1))];
  const media = t.map((series, index) => {
    const active = series.key === i?.key;
    const label = series.items.length === 1 && series.items[0].merged ? "\u5168\u96C6\u89C6\u9891" : `${series.items.length} \u96C6\u53EF\u64AD\u653E`;
    return `<article class="media-card ${active ? "active" : ""}" role="listitem" data-series-key="${d(series.key)}" aria-current="${active}">${I(series, index)}<div><b>${d(series.title)}</b><small data-default-label="${d(label)}">${active ? `\u6B63\u5728\u64AD\u653E \xB7 ${label}` : label}</small></div><button class="media-play-button" data-player-action="play-series" data-series-key="${d(series.key)}" title="\u64AD\u653E" aria-label="\u64AD\u653E\u300A${d(series.title)}\u300B"><i data-lucide="play"></i></button></article>`;
  }).join("");
  const side = `<aside class="player-side ${s.playerPanelOpen ? "open" : ""}" aria-hidden="${!s.playerPanelOpen}"><div class="player-tabs library-title"><div class="section-label"><b>\u5A92\u4F53\u5E93</b><span class="section-count">${t.length}</span></div><button class="panel-close" data-player-action="toggle-panel" title="\u5173\u95ED\u5A92\u4F53\u5E93" aria-label="\u5173\u95ED\u5A92\u4F53\u5E93"><i data-lucide="x"></i></button></div><div class="media-library" role="list">${media}</div>${episodeSection(i)}</aside>`;
  const speed = s.playbackSpeed || 1;
  const controls = `<div class="player-controls"><div class="progress-wrap" id="progress-wrap" role="slider" tabindex="0" aria-label="\u64AD\u653E\u8FDB\u5EA6" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="00:00 / 00:00"><div class="progress-buffer" id="progress-buffer"></div><div class="progress-played" id="progress-played"></div><div class="progress-thumb" id="progress-thumb"></div><div class="progress-tooltip" id="progress-tooltip">00:00</div></div><div class="control-row"><div class="transport"><button data-player-action="previous" title="\u4E0A\u4E00\u4E2A (P)" aria-label="\u4E0A\u4E00\u4E2A"><i data-lucide="skip-back"></i></button><button data-player-action="seek-back" title="\u540E\u9000 10 \u79D2 (\u2190)" aria-label="\u540E\u9000 10 \u79D2"><i data-lucide="rewind"></i></button><button class="primary-play" data-player-action="toggle-play" title="\u64AD\u653E/\u6682\u505C (Space)" aria-label="\u64AD\u653E\u6216\u6682\u505C"><i class="play-glyph" data-lucide="play"></i><i class="pause-glyph" data-lucide="pause"></i></button><button data-player-action="seek-forward" title="\u5FEB\u8FDB 10 \u79D2 (\u2192)" aria-label="\u5FEB\u8FDB 10 \u79D2"><i data-lucide="fast-forward"></i></button><button data-player-action="next" title="\u4E0B\u4E00\u4E2A (N)" aria-label="\u4E0B\u4E00\u4E2A"><i data-lucide="skip-forward"></i></button><span id="player-time">00:00 / 00:00</span></div><div class="control-right"><button class="speed-btn" id="speed-btn" data-player-action="cycle-speed" title="\u64AD\u653E\u901F\u5EA6" aria-label="\u5207\u6362\u64AD\u653E\u901F\u5EA6">${speed}x</button><div class="volume-control"><button data-player-action="toggle-mute" title="\u9759\u97F3 (M)" aria-label="\u9759\u97F3\u6216\u6062\u590D\u97F3\u91CF"><i class="vol-icon" data-lucide="volume-2"></i></button><input id="player-volume" type="range" min="0" max="1" step="0.05" value="0.8" aria-label="\u97F3\u91CF" /></div><button data-player-action="fullscreen" title="\u5168\u5C4F (F)" aria-label="\u8FDB\u5165\u6216\u9000\u51FA\u5168\u5C4F"><i data-lucide="fullscreen"></i></button><button class="panel-toggle" data-player-action="toggle-panel" title="\u5A92\u4F53\u5E93" aria-label="${s.playerPanelOpen ? "\u5173\u95ED\u5A92\u4F53\u5E93" : "\u6253\u5F00\u5A92\u4F53\u5E93"}" aria-expanded="${s.playerPanelOpen}"><i data-lucide="panel-right"></i></button></div></div></div>`;
  const stage = a ? `<video id="player-video" src="${d(ye(a.path))}" preload="metadata" playsinline></video><button class="video-hit" data-player-action="toggle-play" aria-label="\u64AD\u653E\u6216\u6682\u505C"></button><div class="player-error" role="status" aria-live="polite"></div><div class="video-shade"></div><div class="now-playing"><span>${a.merged ? "FEATURE CUT" : `EPISODE ${a.episode}`}</span><b>${d(i?.title || "")}</b><small>${d(a.title)}</small></div><div class="center-indicator" id="center-indicator"></div>${controls}` : '<div class="empty-stage"><i data-lucide="film"></i><b>\u4ECE\u5A92\u4F53\u5E93\u9009\u62E9\u4E00\u90E8\u77ED\u5267</b></div>';
  return `<div class="view player-view"><div class="page-head reveal"><div><span class="eyebrow">PLAYER / 04</span><h1>\u672C\u5730\u653E\u6620\u5BA4</h1><p>\u64AD\u653E\u5DF2\u4E0B\u8F7D\u5185\u5BB9\uFF0C\u6309\u77ED\u5267\u4E0E\u96C6\u6570\u8FDE\u7EED\u8854\u63A5\u3002</p></div><span class="head-note">${t.length} SERIES</span></div>${t.length ? `<div class="player-layout reveal delay-1"><section class="player-stage"><div class="video-frame ${a ? "" : "is-empty"}">${stage}${side}</div><div class="player-meta"><div><span class="eyebrow">NOW PLAYING</span><h2>${d(i?.title || "\u5C1A\u672A\u9009\u62E9")}</h2></div>${a ? `<span>${a.merged ? `\u5168\u96C6 \xB7 ${a.episodeTotal} \u96C6` : `\u7B2C ${a.episode} / ${a.episodeTotal} \u96C6`}</span>` : ""}</div></section></div>` : '<section class="player-empty reveal delay-1"><i data-lucide="film"></i><h2>\u8FD8\u6CA1\u6709\u53EF\u64AD\u653E\u7684\u89C6\u9891</h2><p>\u77ED\u5267\u4E0B\u8F7D\u5B8C\u6210\u540E\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\u3002</p><button class="signal" data-view="tasks"><i data-lucide="list-video"></i>\u524D\u5F80\u4E0B\u8F7D\u961F\u5217</button></section>'}</div>`;
}
function At() {
  const t = s.snapshot.config || {};
  return `<div class="view"><div class="page-head reveal"><div><span class="eyebrow">SYSTEM / 05</span><h1>\u7CFB\u7EDF\u8BBE\u7F6E</h1><p>\u672C\u673A\u914D\u7F6E\u53EA\u4FDD\u5B58\u5728\u672C\u5730\uFF0C\u7528\u4E8E\u89E3\u6790\u8EAB\u4EFD\u4E0E\u4E0B\u8F7D\u7B56\u7565\u3002</p></div></div><section class="settings-grid reveal delay-1"><article class="settings-card"><div class="settings-title"><i data-lucide="hard-drive"></i><div><b>\u672C\u5730\u5A92\u4F53</b><small>\u6240\u6709\u5206\u96C6\u548C\u5408\u96C6\u7684\u4FDD\u5B58\u4F4D\u7F6E</small></div></div><div class="path-field"><input id="output-dir" value="${s.snapshot.output_dir || "%USERPROFILE%\\Videos\\\u77ED\u5267\u4E0B\u8F7D"}" /><button class="ghost" data-action="open-output"><i data-lucide="folder-open"></i>\u6253\u5F00</button></div><p class="hint">\u9ED8\u8BA4\u4F7F\u7528 Windows \u7528\u6237 Videos \u76EE\u5F55\uFF0C\u4E0B\u8F7D\u4E2D\u7684\u6587\u4EF6\u4F1A\u653E\u5728\u9690\u85CF\u7684 .parts \u6587\u4EF6\u5939\u3002</p></article><article class="settings-card"><div class="settings-title"><i data-lucide="sliders-horizontal"></i><div><b>\u4EFB\u52A1\u7B56\u7565</b><small>\u63A7\u5236\u901F\u5EA6\u4E0E\u8D44\u6E90\u5360\u7528</small></div></div><label class="setting-line"><span>\u5E76\u53D1\u4E0B\u8F7D</span><select id="workers"><option ${t.download_workers === 2 ? "selected" : ""}>2</option><option ${!t.download_workers || t.download_workers === 4 ? "selected" : ""}>4</option><option ${t.download_workers === 6 ? "selected" : ""}>6</option><option ${t.download_workers === 8 ? "selected" : ""}>8</option></select></label><label class="setting-line toggle-line"><span>\u5B8C\u6210\u540E\u81EA\u52A8\u5408\u5E76</span><input id="auto-merge" type="checkbox" ${t.auto_merge !== false ? "checked" : ""} /><span class="toggle"></span></label><button class="signal save-settings" data-action="save-settings"><i data-lucide="check"></i>\u4FDD\u5B58\u8BBE\u7F6E</button></article></section><section class="identity-card reveal delay-2"><div><span class="eyebrow">PARSER IDENTITY</span><h2>\u89E3\u6790\u8EAB\u4EFD</h2><p>device_id\u3001install_id \u548C\u5E73\u53F0\u4FE1\u606F\u7531 Python \u89E3\u6790\u5668\u8BFB\u53D6\u3002\u4FDD\u7559\u5728\u672C\u673A\uFF0C\u4E0D\u4F1A\u4E0A\u4F20\u5230 UI \u5C42\u3002</p></div><div class="identity-controls"><label>device_id<input id="device-id" value="${d(t.device_id || "")}" placeholder="\u8BBE\u5907 ID" /></label><label>install_id<input id="install-id" value="${d(t.install_id || "")}" placeholder="\u5B89\u88C5 ID" /></label><label>\u5E73\u53F0<select id="platform"><option ${t.platform === "ios" ? "selected" : ""}>ios</option><option ${t.platform !== "ios" ? "selected" : ""}>android</option></select></label><span class="local-badge"><i data-lucide="shield-check"></i>LOCAL ONLY</span></div></section></div>`;
}
function m() {
  const t = s.view === "home" ? _t() : s.view === "search" ? $t() : s.view === "tasks" ? Et() : s.view === "player" ? Nt() : At();
  document.querySelector("#app").innerHTML = ft(t);
  if (s.view === "player") {
    const head = document.querySelector(".player-view > .page-head"), note = head?.querySelector(".head-note");
    if (head && note) {
      const actions = document.createElement("div"), button = document.createElement("button");
      actions.className = "player-head-actions";
      button.className = "player-library-button";
      button.dataset.playerAction = "toggle-panel";
      button.title = "\u5A92\u4F53\u5E93";
      button.setAttribute("aria-label", s.playerPanelOpen ? "\u5173\u95ED\u5A92\u4F53\u5E93" : "\u6253\u5F00\u5A92\u4F53\u5E93");
      button.setAttribute("aria-expanded", String(s.playerPanelOpen));
      button.innerHTML = '<i data-lucide="panel-right"></i><span>\u5A92\u4F53\u5E93</span>';
      note.replaceWith(actions);
      actions.append(note, button);
    }
  }
  lt({ icons: dt }), s.playerFullscreen && s.view !== "player" && setPlayerFullscreen(false), syncPlayerFullscreenClass(), Lt(), s.playerPanelOpen && revealActivePanelEpisode();
}
function ne(t) {
  if (!Number.isFinite(t) || t < 0) return "00:00";
  const e = Math.floor(t), i = Math.floor(e / 3600), a = Math.floor(e % 3600 / 60), n = e % 60;
  return i ? `${i}:${String(a).padStart(2, "0")}:${String(n).padStart(2, "0")}` : `${String(a).padStart(2, "0")}:${String(n).padStart(2, "0")}`;
}
function kt() {
  document.onkeydown = (ev) => {
    if (ev.target.tagName === "INPUT" || ev.target.tagName === "SELECT" || ev.target.tagName === "TEXTAREA") return;
    if (ev.target.closest?.("#progress-wrap")) return;
    const video = document.querySelector("#player-video");
    if (!video && ev.key !== "Escape") return;
    if (ev.key === "Escape") { s.playerFullscreen ? setPlayerFullscreen(false) : s.detailSeries && (s.detailSeries = "", m()); return; }
    const vol = document.querySelector("#player-volume");
    switch (ev.key) {
      case " ": ev.preventDefault(); video.paused ? video.play() : video.pause(); break;
      case "ArrowLeft": ev.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); break;
      case "ArrowRight": ev.preventDefault(); video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); break;
      case "ArrowUp": ev.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); if (vol) vol.value = String(video.volume); localStorage.setItem("frame-player-volume", String(video.volume)); updateVolumeIcon(video); break;
      case "ArrowDown": ev.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); if (vol) vol.value = String(video.volume); localStorage.setItem("frame-player-volume", String(video.volume)); updateVolumeIcon(video); break;
      case "f": case "F": setPlayerFullscreen(!s.playerFullscreen); break;
      case "m": case "M": video.muted = !video.muted; updateVolumeIcon(video); break;
      case "n": case "N": B(1); break;
      case "p": case "P": B(-1); break;
    }
  };
  document.querySelector(".player-view")?.addEventListener("click", (event) => {
    const r = event.target.closest?.("[data-player-action]");
    if (!r) return;
    const u = r.dataset.playerAction || "", y = r.dataset.seriesKey || s.activeSeries;
    if (u === "play-series") {
      if (s.playerFullscreen && playEpisodeInline(y, 0)) return;
      W(y, 0);
      return;
    }
    if (u === "play-episode") {
      const episodeIndex = Number(r.dataset.episodeIndex || 0);
      if (s.playerFullscreen && playEpisodeInline(y, episodeIndex)) return;
      W(y, episodeIndex);
      return;
    }
    if (u === "toggle-panel") {
      s.playerPanelOpen = !s.playerPanelOpen;
      const p = document.querySelector(".player-side"), toggles = document.querySelectorAll(".player-library-button, .panel-toggle");
      if (p) {
        p.classList.toggle("open", s.playerPanelOpen);
        p.setAttribute("aria-hidden", String(!s.playerPanelOpen));
      }
      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", String(s.playerPanelOpen));
        toggle.setAttribute("aria-label", s.playerPanelOpen ? "\u5173\u95ED\u5A92\u4F53\u5E93" : "\u6253\u5F00\u5A92\u4F53\u5E93");
      });
      s.playerPanelOpen && revealActivePanelEpisode();
      return;
    }
    const w = document.querySelector("#player-video");
    if (!w) return;
    if (u === "toggle-play") { w.paused ? w.play() : w.pause(); }
    else if (u === "previous") { B(-1); }
    else if (u === "next") { B(1); }
    else if (u === "seek-back") { w.currentTime = Math.max(0, w.currentTime - 10); }
    else if (u === "seek-forward") { w.currentTime = Math.min(w.duration || 0, w.currentTime + 10); }
    else if (u === "toggle-mute") { w.muted = !w.muted; updateVolumeIcon(w); }
    else if (u === "cycle-speed") { cycleSpeed(w); }
    else if (u === "fullscreen") { setPlayerFullscreen(!s.playerFullscreen); }
  });
  const t = document.querySelector("#player-video"), e = document.querySelector("#progress-wrap"), i = document.querySelector("#player-volume"), a = document.querySelector("#player-time"), n = document.querySelector(".player-stage");
  if (!t || !e || !i || !a || !n) return;
  const o = Number(localStorage.getItem("frame-player-volume") || "0.8");
  t.volume = Number.isFinite(o) ? Math.max(0, Math.min(1, o)) : 0.8;
  i.value = String(t.volume);
  t.playbackRate = s.playbackSpeed || 1;
  updateVolumeIcon(t);
  const played = document.querySelector("#progress-played");
  const buffer = document.querySelector("#progress-buffer");
  const thumb = document.querySelector("#progress-thumb");
  const tooltip = document.querySelector("#progress-tooltip");
  const updateTime = () => {
    const pct = t.duration ? t.currentTime / t.duration * 100 : 0;
    if (played) played.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
    a.textContent = `${ne(t.currentTime)} / ${ne(t.duration)}`;
    e.setAttribute("aria-valuemax", String(Math.round(t.duration || 0)));
    e.setAttribute("aria-valuenow", String(Math.round(t.currentTime || 0)));
    e.setAttribute("aria-valuetext", a.textContent);
    if (t.duration && t.currentTime > 5) {
      try { localStorage.setItem("frame-resume-" + t.src.split("/").pop(), String(t.currentTime)); } catch (_) {}
    }
  };
  const updateBuffer = () => {
    if (!buffer || !t.duration || !t.buffered.length) return;
    const end = t.buffered.end(t.buffered.length - 1);
    buffer.style.width = (end / t.duration * 100) + "%";
  };
  t.addEventListener("timeupdate", updateTime);
  t.addEventListener("loadedmetadata", () => {
    updateTime();
    const saved = localStorage.getItem("frame-resume-" + t.src.split("/").pop());
    if (saved && Number(saved) > 5 && Number(saved) < (t.duration || Infinity) - 10) {
      t.currentTime = Number(saved);
    }
  });
  t.addEventListener("progress", updateBuffer);
  t.addEventListener("playing", () => {
    n.classList.add("is-playing");
    const error = document.querySelector(".player-error");
    if (error) error.textContent = "";
  });
  t.addEventListener("canplay", () => {
    const error = document.querySelector(".player-error");
    if (error) error.textContent = "";
  });
  t.addEventListener("pause", () => n.classList.remove("is-playing"));
  t.addEventListener("ended", () => {
    try { localStorage.removeItem("frame-resume-" + t.src.split("/").pop()); } catch (_) {}
    B(1, true);
  });
  t.addEventListener("error", () => {
    const r = document.querySelector(".player-error");
    r && (r.textContent = "\u89C6\u9891\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4ECD\u5728\u4E0B\u8F7D\u76EE\u5F55\u4E2D\u3002");
  });
  let dragging = false;
  const seekFromEvent = (ev) => {
    const rect = e.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    if (t.duration) t.currentTime = pct * t.duration;
    if (played) played.style.width = (pct * 100) + "%";
    if (thumb) thumb.style.left = (pct * 100) + "%";
  };
  e.addEventListener("pointerdown", (ev) => { dragging = true; e.setPointerCapture(ev.pointerId); seekFromEvent(ev); });
  e.addEventListener("pointermove", (ev) => {
    const rect = e.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    if (tooltip) { tooltip.style.left = (pct * 100) + "%"; tooltip.textContent = ne(pct * (t.duration || 0)); tooltip.classList.add("visible"); }
    if (dragging) seekFromEvent(ev);
  });
  e.addEventListener("pointerup", () => { dragging = false; });
  e.addEventListener("pointerleave", () => { if (tooltip) tooltip.classList.remove("visible"); });
  e.addEventListener("keydown", (ev) => {
    if (!t.duration || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
    ev.preventDefault();
    if (ev.key === "Home") t.currentTime = 0;
    else if (ev.key === "End") t.currentTime = t.duration;
    else t.currentTime = Math.max(0, Math.min(t.duration, t.currentTime + (ev.key === "ArrowRight" ? 5 : -5)));
    updateTime();
  });
  i.addEventListener("input", () => {
    t.volume = Number(i.value); t.muted = false;
    localStorage.setItem("frame-player-volume", i.value);
    updateVolumeIcon(t);
  });
  s.autoplay && (s.autoplay = false, t.play().catch(() => {}));
}
function updateVolumeIcon(video) {
  const icon = document.querySelector(".vol-icon");
  if (!icon) return;
  const name = video.muted || video.volume === 0 ? "volume-x" : video.volume < 0.5 ? "volume-1" : "volume-2";
  if (icon.getAttribute("data-lucide") === name && icon.querySelector("svg")) return;
  icon.setAttribute("data-lucide", name);
  lt({ icons: dt });
}
function cycleSpeed(video) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const idx = speeds.indexOf(s.playbackSpeed || 1);
  s.playbackSpeed = speeds[(idx + 1) % speeds.length];
  video.playbackRate = s.playbackSpeed;
  const btn = document.querySelector("#speed-btn");
  if (btn) btn.textContent = s.playbackSpeed + "x";
}
function Lt() {
  document.querySelectorAll("[data-view]").forEach((t) => t.addEventListener("click", async () => {
    const e = t.dataset.view || "home";
    e !== "player" && s.playerFullscreen && await setPlayerFullscreen(false), s.view = e, m();
  })), document.querySelectorAll("[data-window]").forEach((t) => t.addEventListener("click", async () => {
    const e = ue();
    t.dataset.window === "close" && await e.close(), t.dataset.window === "minimize" && await e.minimize(), t.dataset.window === "maximize" && await e.toggleMaximize();
  })), document.querySelectorAll("[data-action]").forEach((t) => t.addEventListener("click", () => le(t.dataset.action || ""))), document.querySelectorAll("[data-delete-series]").forEach((t) => t.addEventListener("click", async () => {
    if (s.snapshot.running) return;
    const e = t.dataset.seriesTitle || "\u8FD9\u90E8\u77ED\u5267";
    if (!window.confirm(`\u4ECE\u4E0B\u8F7D\u961F\u5217\u5220\u9664\u300A${e}\u300B\uFF1F

\u5DF2\u4E0B\u8F7D\u7684\u89C6\u9891\u6587\u4EF6\u4F1A\u4FDD\u7559\u3002`)) return;
    t.disabled = true, await S("delete-series", { series_key: t.dataset.seriesKey || "" }) || window.alert("\u5220\u9664\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"), await $();
  })), document.querySelectorAll(".queue-row[data-series-key]").forEach((t) => {
    const e = () => {
      s.detailSeries = t.dataset.seriesKey || "", m();
    };
    t.addEventListener("dblclick", (i) => {
      i.target.closest("[data-delete-series]") || e();
    }), t.addEventListener("keydown", (i) => {
      i.key === "Enter" && e();
    });
  }), document.querySelectorAll("[data-close-task-detail]").forEach((t) => t.addEventListener("click", (e) => {
    t.classList.contains("task-detail-backdrop") && e.target !== t || (s.detailSeries = "", m());
  })), document.querySelectorAll("[data-result-index]").forEach((t) => t.addEventListener("click", async () => {
    const e = s.search[Number(t.dataset.resultIndex)], i = String(e?.drama_id || "").trim();
    if (!i) return;
    const a = Number(String(e.episodes || "").match(/\d+/)?.[0] || 1), n = String(e.title || i);
    s.tasks = [...s.tasks.filter((o2) => !(o2._placeholder && String(o2.series_id || "") === i)), { title: n, series_title: n, episode: 0, episode_total: a, id: `pending:${i}`, series_id: i, source_url: String(e.source_url || ""), cover_url: String(e.cover_url || ""), cover_path: String(e.cover_path || ""), status: "\u7B49\u5F85", url: "", local_path: "", merge_status: "", merge_progress: 0, msg: "\u6B63\u5728\u89E3\u6790\u5168\u96C6\u5E76\u5199\u5165\u4E0B\u8F7D\u961F\u5217\u2026", _placeholder: true }], s.view = "tasks", m();
    const o = await S("enqueue", { raw: i, item: e });
    o?.errors?.length && window.alert(o.errors.join("\n")), await $(), Number(o?.added || 0) > 0 && !s.snapshot.running && await le("start");
  })), document.querySelectorAll(".poster img").forEach((t) => t.addEventListener("error", () => {
    t.closest(".poster")?.classList.remove("has-cover"), t.remove();
  }, { once: true })), document.querySelectorAll("input").forEach((t) => t.addEventListener("keydown", (e) => {
    e.key === "Enter" && le(t.id.includes("keyword") ? "search" : "enqueue");
  })), kt();
}
async function le(t) {
  if (t === "search") {
    if (s.searching) return;
    const e = ++s.searchVersion;
    s.keyword = (document.querySelector("#search-keyword, #home-keyword")?.value || s.keyword).trim(), s.category = document.querySelector("#search-category")?.value || s.category, s.source = document.querySelector("#search-source")?.value || s.source, s.page = document.querySelector("#search-page")?.value || s.page, s.view = "search", s.searching = true, m();
    const i = await S("search", { keyword: s.keyword, category: s.category, source: s.source, page: s.page });
    if (e !== s.searchVersion) return;
    s.search = (i?.items || []).map((a) => ({ ...a, _cover_loading: !we(a) })), s.searching = false, m(), gt(e, s.search);
    return;
  }
  if (t === "enqueue") {
    const e = document.querySelector("#queue-raw, #home-raw")?.value || "";
    if (!e.trim()) {
      s.notice = "\u8BF7\u5148\u7C98\u8D34\u5206\u4EAB\u94FE\u63A5\u6216\u77ED\u5267 ID";
      return;
    }
    const i = await S("enqueue", { raw: e });
    s.view = "tasks", await $(), Number(i?.added || 0) > 0 && !s.snapshot.running && await le("start");
    return;
  }
  if (t === "start") {
    if (s.starting || s.snapshot.running) return;
    s.starting = true, vt();
    const e = await S("start");
    if (!e) {
      s.notice = "\u542F\u52A8\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", s.starting = false, m();
      return;
    }
    s.snapshot.running = e.started !== false || e.reason === "already-running";
    s.notice = s.snapshot.running ? "" : "\u4E0B\u8F7D\u5F15\u64CE\u672A\u80FD\u542F\u52A8";
    s.starting = false, m();
    void $(false);
    return;
  }
  if (t === "pause") {
    await S("pause"), await $();
    return;
  }
  if (t === "retry") {
    await S("retry", {}), await $();
    return;
  }
  if (t === "open-output") {
    await ht(s.snapshot.output_dir);
    return;
  }
  if (t === "clear") {
    await S("clear"), await $();
    return;
  }
  if (t === "save-settings") {
    const e = { ...s.snapshot.config, device_id: document.querySelector("#device-id")?.value.trim() || "", install_id: document.querySelector("#install-id")?.value.trim() || "", platform: document.querySelector("#platform")?.value || "android", download_dir: document.querySelector("#output-dir")?.value || s.snapshot.output_dir, download_workers: Number(document.querySelector("#workers")?.value || 4), auto_merge: document.querySelector("#auto-merge")?.checked !== false };
    await S("save-settings", e), s.snapshot.config = e, s.snapshot.output_dir = e.download_dir, m();
  }
}
m();
$();
setInterval(() => {
  s.snapshot.running && $(false);
}, 1200);

"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { uploadFileDirect } from "@/lib/client-upload";
import type { ManuscriptFigure } from "@/components/manuscript-editor";
import {
  WordTableEditor,
  htmlToTableModel,
  type WordTableModel,
} from "@/components/word-table-editor";
import {
  clearDropMarkers,
  clearFigureSelection,
  closestDropBlock,
  isEditableFigure,
  isEmptyImagePlaceholder,
  moveFigureRelativeTo,
  selectFigure,
  setDropMarker,
} from "@/lib/figure-chrome";

type Props = {
  /** Element that wraps the template editables (abstract + body). */
  scopeRef: RefObject<HTMLElement | null>;
  onError?: (message: string) => void;
  onFigureAdded?: (figure: ManuscriptFigure) => void;
  journalPrimary?: string;
};

const TEXT_COLORS = [
  { value: "#0b1f33", label: "Ink" },
  { value: "#5b6b7c", label: "Muted" },
  { value: "#b42318", label: "Red" },
  { value: "#c2410c", label: "Orange" },
  { value: "#a16207", label: "Gold" },
  { value: "#1a5f4a", label: "Green" },
  { value: "#1d4e89", label: "Blue" },
  { value: "#6b2d5b", label: "Plum" },
];

const HIGHLIGHT_COLORS = [
  { value: "#fef3c7", label: "Yellow" },
  { value: "#fecaca", label: "Red" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#e9d5ff", label: "Purple" },
];

const FONT_OPTIONS = [
  { value: "", label: "Font" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Calibri", label: "Calibri" },
  { value: "Palatino Linotype", label: "Palatino" },
  { value: "Courier New", label: "Courier" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Size" },
  { value: "0", label: "Default" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "15", label: "15" },
  { value: "16", label: "16" },
  { value: "18", label: "18" },
  { value: "19", label: "19" },
  { value: "20", label: "20" },
  { value: "22", label: "22" },
  { value: "24", label: "24" },
  { value: "28", label: "28" },
  { value: "32", label: "32" },
];

const selectClass =
  "h-7 max-w-[9.5rem] rounded-md border border-[var(--line)] bg-white px-1.5 text-[11px] font-semibold text-[var(--ink)] outline-none hover:border-[var(--accent)]/40 focus:border-[var(--accent)]";

function ToolBtn({
  title,
  onClick,
  children,
  disabled,
  active,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-white text-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/30"
          : "text-[var(--ink)] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <span className="mx-1 hidden h-5 w-px self-center bg-[var(--line)] sm:block" />
  );
}

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

function figureHtml(caption: string, url: string) {
  return `<figure class="figure-full"><img src="${url}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
}

function applyImagesToFigure(
  figure: HTMLElement,
  images: Array<{ url: string; caption: string }>,
) {
  const first = images[0];
  if (!first) return;

  figure.querySelectorAll(":scope > img").forEach((img) => img.remove());

  const existingCap = figure.querySelector("figcaption");
  const captionText =
    existingCap?.textContent?.trim() || first.caption || "Figure";

  const img = document.createElement("img");
  img.src = first.url;
  img.alt = captionText;
  if (existingCap) figure.insertBefore(img, existingCap);
  else {
    figure.appendChild(img);
    const cap = document.createElement("figcaption");
    cap.textContent = captionText;
    figure.appendChild(cap);
  }
  figure.classList.add("figure-full");

  let last: Element = figure;
  for (const extra of images.slice(1)) {
    const tmp = document.createElement("div");
    tmp.innerHTML = figureHtml(extra.caption, extra.url);
    const next = tmp.firstElementChild;
    if (!next) continue;
    last.after(next);
    last = next;
  }
}

function insertHtmlAtRange(html: string, range: Range) {
  range.deleteContents();
  const frag = range.createContextualFragment(html);
  const last = frag.lastChild;
  range.insertNode(frag);
  if (!last) return;
  const after = document.createRange();
  after.setStartAfter(last);
  after.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(after);
}

function notifyEditorChanged(el: HTMLElement) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function parsePt(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.trim().match(/^([\d.]+)\s*(px|pt)?$/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  if ((match[2] || "px").toLowerCase() === "px") return n * 0.75;
  return n;
}

/**
 * Formatting + image tools for in-template abstract/body editing.
 * Applies to whichever `[data-omicron-rich]` field last held the caret.
 */
export function TemplateFormatToolbar({
  scopeRef,
  onError,
  onFigureAdded,
  journalPrimary,
}: Props) {
  const fileId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const activeEditorRef = useRef<HTMLElement | null>(null);
  const targetFigureRef = useRef<HTMLElement | null>(null);
  /** Survives blur/DOM rewrite while the OS file picker is open. */
  const pendingUploadIdRef = useRef<string | null>(null);
  const targetTableRef = useRef<HTMLElement | null>(null);
  const draggedFigureRef = useRef<HTMLElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkLabel, setLinkLabel] = useState("");
  const [customSize, setCustomSize] = useState("18");
  const [tableOpen, setTableOpen] = useState(false);
  const [tableUpdateMode, setTableUpdateMode] = useState(false);
  const [tableSeed, setTableSeed] = useState<WordTableModel | null>(null);
  const [tableEditorKey, setTableEditorKey] = useState(0);
  const [bubble, setBubble] = useState<{
    top: number;
    left: number;
    placeBelow: boolean;
  } | null>(null);
  const [bubbleReady, setBubbleReady] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const keepBubbleRef = useRef(false);
  const pointerDownRef = useRef(false);

  const editorFromNode = useCallback(
    (node: Node | null): HTMLElement | null => {
      const scope = scopeRef.current;
      if (!scope || !node) return null;
      if (bubbleRef.current?.contains(node)) return null;
      const start =
        node instanceof Element ? node : node.parentElement;
      if (!start) return null;
      const el =
        start.closest(
          "[data-omicron-rich='true'], .omicron-template-editable[contenteditable], [contenteditable='true']",
        ) ?? null;
      if (!(el instanceof HTMLElement) || !scope.contains(el)) return null;
      if (el.closest("[data-selection-toolbar='true']")) return null;
      return el;
    },
    [scopeRef],
  );

  const capture = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const el = editorFromNode(sel.anchorNode) ?? editorFromNode(sel.focusNode);
    if (!el) return;
    activeEditorRef.current = el;
    try {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } catch {
      /* ignore */
    }
  }, [editorFromNode]);
  const captureRef = useRef(capture);
  captureRef.current = capture;

  const updateBubble = useCallback(() => {
    const scope = scopeRef.current;
    const sel = window.getSelection();
    if (!scope || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      // Keep visible while interacting with the bubble itself (color picker, etc.).
      if (!keepBubbleRef.current) setBubble(null);
      return;
    }

    const anchorInScope = Boolean(
      sel.anchorNode && scope.contains(sel.anchorNode),
    );
    const focusInScope = Boolean(
      sel.focusNode && scope.contains(sel.focusNode),
    );
    if (!anchorInScope && !focusInScope) {
      if (!keepBubbleRef.current) setBubble(null);
      return;
    }

    // Prefer a rich/contenteditable field; fall back to any node in scope.
    const el =
      editorFromNode(sel.anchorNode) ??
      editorFromNode(sel.focusNode) ??
      (sel.anchorNode instanceof HTMLElement
        ? sel.anchorNode
        : sel.anchorNode?.parentElement) ??
      null;

    if (el instanceof HTMLElement && scope.contains(el)) {
      activeEditorRef.current = editorFromNode(el) ?? el;
    }

    try {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } catch {
      /* ignore */
    }

    const range = sel.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      const rects = Array.from(range.getClientRects());
      if (rects.length) {
        const first = rects[0];
        const last = rects[rects.length - 1];
        rect = new DOMRect(
          first.left,
          first.top,
          Math.max(last.right - first.left, first.width),
          Math.max(last.bottom - first.top, first.height),
        );
      } else if (el instanceof HTMLElement) {
        rect = el.getBoundingClientRect();
      }
    }

    if (!Number.isFinite(rect.top) || !Number.isFinite(rect.left)) {
      if (!keepBubbleRef.current) setBubble(null);
      return;
    }

    const pad = 12;
    const approxWidth = Math.min(520, window.innerWidth - pad * 2);
    const placeBelow = rect.top < 72;
    let left = rect.left + Math.max(rect.width, 1) / 2;
    left = Math.max(
      pad + approxWidth / 2,
      Math.min(window.innerWidth - pad - approxWidth / 2, left),
    );
    const top = placeBelow ? rect.bottom + 12 : Math.max(pad, rect.top - 12);
    setBubble({ top, left, placeBelow });
  }, [editorFromNode, scopeRef]);

  useEffect(() => {
    setBubbleReady(true);
  }, []);

  useEffect(() => {
    let debounceTimer: number | null = null;

    const schedule = (immediate = false) => {
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      const run = () => {
        capture();
        updateBubble();
      };
      if (immediate) {
        requestAnimationFrame(run);
        return;
      }
      debounceTimer = window.setTimeout(run, 16);
    };

    const onSel = () => {
      // While the mouse is down, wait for mouseup so the bar does not chase.
      if (pointerDownRef.current || keepBubbleRef.current) return;
      schedule(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (bubbleRef.current?.contains(e.target as Node)) return;
      pointerDownRef.current = true;
    };

    const finishPointer = () => {
      pointerDownRef.current = false;
      const tryShow = () => {
        capture();
        updateBubble();
      };
      // Selection is often finalized a frame (or two) after mouseup.
      requestAnimationFrame(() => requestAnimationFrame(tryShow));
      window.setTimeout(tryShow, 40);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBubble(null);
        return;
      }
      if (e.shiftKey || e.key.startsWith("Arrow") || e.key === "A" || e.metaKey || e.ctrlKey) {
        schedule(true);
      }
    };

    const onScrollOrResize = () => updateBubble();

    document.addEventListener("selectionchange", onSel);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", finishPointer, true);
    document.addEventListener("pointercancel", finishPointer, true);
    document.addEventListener("mouseup", finishPointer, true);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      document.removeEventListener("selectionchange", onSel);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", finishPointer, true);
      document.removeEventListener("pointercancel", finishPointer, true);
      document.removeEventListener("mouseup", finishPointer, true);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [capture, updateBubble]);

  // Figures + tables: select / replace / delete / cancel / drag-move / edit table.
  useEffect(() => {
    function editorFor(node: Element): HTMLElement | null {
      const editor = node.closest("[data-omicron-rich='true']");
      return editor instanceof HTMLElement ? editor : null;
    }

    function closestTableTarget(el: HTMLElement, scope: HTMLElement) {
      const fig = el.closest("figure");
      if (
        fig &&
        scope.contains(fig) &&
        (fig.querySelector("table, .omicron-table-wrap") ||
          fig.classList.contains("table-full"))
      ) {
        return fig;
      }
      const wrap = el.closest(".omicron-table-wrap");
      if (wrap instanceof HTMLElement && scope.contains(wrap)) return wrap;
      const table = el.closest("table");
      if (table instanceof HTMLElement && scope.contains(table)) return table;
      return null;
    }

    function openTableEditor(el: HTMLElement) {
      targetTableRef.current = el;
      const siblingCaption =
        el.previousElementSibling &&
        /^table(?:\s+\d+)?(?:[.:]|\s|$)/i.test(
          el.previousElementSibling.textContent?.trim() ?? "",
        )
          ? el.previousElementSibling.textContent?.trim() ?? ""
          : "";
      setTableSeed(htmlToTableModel(el, siblingCaption));
      setTableUpdateMode(true);
      setTableEditorKey((k) => k + 1);
      setTableOpen(true);
      setLinkOpen(false);
      clearFigureSelection(scopeRef.current);
    }

    function markFigureForUpload(fig: HTMLElement) {
      const id = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      fig.setAttribute("data-omicron-fig-id", id);
      pendingUploadIdRef.current = id;
      targetFigureRef.current = fig;
    }

    function openFilePickerFor(fig: HTMLElement, scope: HTMLElement) {
      if (uploading) return;
      const editor = editorFor(fig);
      if (editor) activeEditorRef.current = editor;
      // Pin this exact slot before the file dialog steals focus / rewrites DOM.
      markFigureForUpload(fig);
      captureRef.current();
      // Open the picker in the same user gesture. Do this before any
      // preventDefault, or browsers will silently block the dialog.
      fileInputRef.current?.click();
      // Don't selectFigure yet for empty slots — chrome + blur rewrite can
      // move the insert target. Selection is restored after upload.
      if (fig.querySelector(":scope > img")) selectFigure(fig, scope);
    }

    function runFigAction(action: string | null, fig: HTMLElement, scope: HTMLElement) {
      const editor = editorFor(fig);
      if (editor) activeEditorRef.current = editor;

      if (action === "cancel") {
        clearFigureSelection(scope);
        targetFigureRef.current = null;
        pendingUploadIdRef.current = null;
        return;
      }
      if (action === "delete") {
        clearFigureSelection(scope);
        targetFigureRef.current = null;
        pendingUploadIdRef.current = null;
        const parent = fig.parentElement;
        fig.remove();
        if (editor) notifyEditorChanged(editor);
        else if (parent instanceof HTMLElement) notifyEditorChanged(parent);
        return;
      }
      if (action === "replace") {
        openFilePickerFor(fig, scope);
      }
    }

    // Use pointerdown so Replace/Delete/Cancel and empty-slot upload fire
    // before contentEditable steals focus. File picker must open here.
    function onPointerDown(e: PointerEvent) {
      const scope = scopeRef.current;
      if (!scope) return;
      const target = e.target;
      if (!(target instanceof HTMLElement) || !scope.contains(target)) return;

      const chromeBtn = target.closest("[data-fig-action]");
      if (chromeBtn && target.closest(".omicron-fig-chrome")) {
        const fig = chromeBtn.closest("figure");
        if (!fig || !isEditableFigure(fig)) return;
        const action = chromeBtn.getAttribute("data-fig-action");
        // Replace: open picker first, then stop the event.
        if (action === "replace") {
          openFilePickerFor(fig, scope);
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        runFigAction(action, fig, scope);
        return;
      }

      // Empty “Select image to insert” slot → open the OS file picker now.
      if (target.closest(".omicron-fig-chrome")) return;
      const fig = target.closest("figure");
      if (
        fig instanceof HTMLElement &&
        isEditableFigure(fig) &&
        scope.contains(fig) &&
        (isEmptyImagePlaceholder(fig) || !fig.querySelector(":scope > img"))
      ) {
        openFilePickerFor(fig, scope);
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onClick(e: MouseEvent) {
      const scope = scopeRef.current;
      if (!scope) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (!scope.contains(target)) {
        if (!target.closest(".omicron-fig-chrome")) clearFigureSelection(scope);
        return;
      }

      // Already handled on pointerdown (actions + empty image slots).
      if (
        target.closest(".omicron-fig-chrome [data-fig-action]") ||
        (target.closest("figure") &&
          isEditableFigure(target.closest("figure")) &&
          !target.closest("figure")?.querySelector(":scope > img"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (target.closest("figcaption")) {
        // Allow editing the caption text on figures that already have an image.
        return;
      }

      const tableTarget = closestTableTarget(target, scope);
      if (tableTarget) {
        e.preventDefault();
        e.stopPropagation();
        openTableEditor(tableTarget);
        return;
      }

      const fig = target.closest("figure");
      if (!isEditableFigure(fig) || !scope.contains(fig)) {
        clearFigureSelection(scope);
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const editor = editorFor(fig);
      if (editor) activeEditorRef.current = editor;
      targetFigureRef.current = fig;
      selectFigure(fig, scope);
    }

    function onDragStart(e: DragEvent) {
      const scope = scopeRef.current;
      if (!scope) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      // Don't start a figure drag from toolbar buttons.
      if (target.closest(".omicron-fig-chrome button, .omicron-fig-toolbar")) {
        e.preventDefault();
        return;
      }
      const fig = target.closest("figure");
      if (!isEditableFigure(fig) || !scope.contains(fig) || !fig.querySelector("img")) {
        return;
      }
      if (!fig.classList.contains("omicron-fig-selected")) {
        selectFigure(fig, scope);
      }
      draggedFigureRef.current = fig;
      fig.classList.add("omicron-fig-dragging");
      const dt = e.dataTransfer;
      if (!dt) return;
      dt.effectAllowed = "move";
      dt.setData("text/atlas-figure", "1");
      try {
        dt.setDragImage(fig, Math.min(40, fig.clientWidth / 2), 20);
      } catch {
        /* some browsers reject setDragImage */
      }
    }

    function onDragOver(e: DragEvent) {
      const scope = scopeRef.current;
      const fig = draggedFigureRef.current;
      if (!scope || !fig) return;
      const editor = editorFor(fig);
      if (!editor || !scope.contains(editor)) return;
      const target = e.target;
      if (!(target instanceof Node) || !editor.contains(target)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const block = closestDropBlock(target, editor, fig);
      if (!block) {
        setDropMarker(null, null);
        return;
      }
      const rect = block.getBoundingClientRect();
      const place = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
      setDropMarker(block, place);
    }

    function onDrop(e: DragEvent) {
      const scope = scopeRef.current;
      const fig = draggedFigureRef.current;
      if (!scope || !fig) return;
      const editor = editorFor(fig);
      if (!editor) return;
      e.preventDefault();
      e.stopPropagation();
      const marked = editor.querySelector("[data-omicron-drop]") as HTMLElement | null;
      const place = (marked?.getAttribute("data-omicron-drop") || "after") as
        | "before"
        | "after";
      const block =
        marked ??
        closestDropBlock(e.target as Node, editor, fig) ??
        null;
      if (block && moveFigureRelativeTo(fig, block, place)) {
        notifyEditorChanged(editor);
        selectFigure(fig, scope);
      }
      clearDropMarkers(scope);
      draggedFigureRef.current = null;
      fig.classList.remove("omicron-fig-dragging");
    }

    function onDragEnd() {
      const scope = scopeRef.current;
      const fig = draggedFigureRef.current;
      if (scope) clearDropMarkers(scope);
      fig?.classList.remove("omicron-fig-dragging");
      draggedFigureRef.current = null;
    }

    function onKeyDown(e: KeyboardEvent) {
      const scope = scopeRef.current;
      if (!scope) return;
      if (e.key === "Escape") {
        clearFigureSelection(scope);
        targetFigureRef.current = null;
        setTableOpen(false);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = scope.querySelector("figure.omicron-fig-selected");
        if (!(selected instanceof HTMLElement) || !isEditableFigure(selected)) {
          return;
        }
        // Don't steal Backspace while typing in a caption.
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          selected.contains(active) &&
          active.closest("figcaption")
        ) {
          return;
        }
        e.preventDefault();
        runFigAction("delete", selected, scope);
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("dragover", onDragOver, true);
    document.addEventListener("drop", onDrop, true);
    document.addEventListener("dragend", onDragEnd, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("dragover", onDragOver, true);
      document.removeEventListener("drop", onDrop, true);
      document.removeEventListener("dragend", onDragEnd, true);
      document.removeEventListener("keydown", onKeyDown);
      clearFigureSelection(scopeRef.current);
    };
  }, [scopeRef, uploading]);

  const restore = useCallback(() => {
    const el = activeEditorRef.current;
    const range = savedRangeRef.current;
    if (!el) return false;
    el.focus();
    if (!range) return true;
    const sel = window.getSelection();
    if (!sel) return false;
    try {
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } catch {
      return false;
    }
  }, []);

  const run = useCallback(
    (command: string, value?: string) => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then use the toolbar.");
        return;
      }
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, value);
      const el = activeEditorRef.current;
      if (el) notifyEditorChanged(el);
      capture();
    },
    [capture, restore, onError],
  );

  const insertHtml = useCallback(
    (html: string) => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then insert.");
        return;
      }
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        insertHtmlAtRange(html, sel.getRangeAt(0));
      } else {
        document.execCommand("insertHTML", false, html);
      }
      const el = activeEditorRef.current;
      if (el) notifyEditorChanged(el);
      capture();
    },
    [capture, restore, onError],
  );

  const colorTargetFromSelection = useCallback((): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const node = sel.anchorNode;
    const el = node instanceof HTMLElement ? node : node?.parentElement;
    if (!el) return null;
    return el.closest("h1, h2, h3, h4, th") as HTMLElement | null;
  }, []);

  const applyFont = useCallback(
    (font: string) => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then use the toolbar.");
        return;
      }
      const heading = colorTargetFromSelection();
      const root = activeEditorRef.current;
      if (heading && root?.contains(heading)) {
        heading.style.fontFamily = font;
        notifyEditorChanged(root);
        capture();
        return;
      }
      run("fontName", font);
    },
    [capture, restore, onError, colorTargetFromSelection, run],
  );

  const applySize = useCallback(
    (size: string) => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then use the toolbar.");
        return;
      }
      const el = activeEditorRef.current;
      if (!el) return;

      // "0" / empty = reset to default article size (remove inline size).
      if (!size || size === "0") {
        const heading = colorTargetFromSelection();
        if (heading && el.contains(heading)) {
          heading.style.removeProperty("font-size");
          heading.style.removeProperty("letter-spacing");
          notifyEditorChanged(el);
          capture();
          return;
        }
        document.execCommand("removeFormat", false);
        const sel = window.getSelection();
        const node = sel?.anchorNode;
        const painted =
          (node instanceof HTMLElement ? node : node?.parentElement)?.closest(
            "span[style*='font-size'], font",
          ) ?? null;
        if (painted instanceof HTMLElement && el.contains(painted)) {
          painted.style.removeProperty("font-size");
          if (!painted.getAttribute("style")?.trim()) {
            painted.replaceWith(...Array.from(painted.childNodes));
          }
        }
        notifyEditorChanged(el);
        capture();
        return;
      }

      const parsed = Number(size);
      const pt = Number.isFinite(parsed)
        ? String(Math.max(4, Math.min(72, Math.round(parsed))))
        : size;
      setCustomSize(pt);

      const heading = colorTargetFromSelection();
      if (heading && el.contains(heading)) {
        heading.style.fontSize = `${pt}pt`;
        heading.style.letterSpacing = "normal";
        notifyEditorChanged(el);
        capture();
        return;
      }

      el.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "7");
      el.querySelectorAll('font[size="7"], span[style*="xxx-large"]').forEach(
        (node) => {
          const span = document.createElement("span");
          span.style.fontSize = `${pt}pt`;
          span.innerHTML = (node as HTMLElement).innerHTML;
          node.replaceWith(span);
        },
      );
      notifyEditorChanged(el);
      capture();
    },
    [capture, restore, onError, colorTargetFromSelection],
  );

  const bumpSize = useCallback(
    (delta: number) => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then use the toolbar.");
        return;
      }
      const el = activeEditorRef.current;
      if (!el) return;
      const heading = colorTargetFromSelection();
      const target =
        heading && el.contains(heading)
          ? heading
          : (() => {
              const sel = window.getSelection();
              const node = sel?.anchorNode;
              return (
                (node instanceof HTMLElement
                  ? node
                  : node?.parentElement
                )?.closest("span, p, li, h1, h2, h3, h4, td, th") ?? null
              );
            })();

      if (!(target instanceof HTMLElement) || !el.contains(target)) {
        applySize(String(Math.max(4, 18 + delta)));
        return;
      }

      const current =
        parsePt(target.style.fontSize) ??
        parsePt(window.getComputedStyle(target).fontSize) ??
        18;
      const next = Math.max(4, Math.min(72, Math.round(current + delta)));
      setCustomSize(String(next));
      if (heading && el.contains(heading)) {
        heading.style.fontSize = `${next}pt`;
        heading.style.letterSpacing = "normal";
        notifyEditorChanged(el);
        capture();
        return;
      }
      applySize(String(next));
    },
    [capture, restore, onError, colorTargetFromSelection, applySize],
  );

  const applyColor = useCallback(
    (color: string, kind: "fore" | "back") => {
      capture();
      if (!restore()) {
        onError?.("Click in the abstract or body first, then use the toolbar.");
        return;
      }
      const el = activeEditorRef.current;
      if (!el) return;
      el.focus();
      document.execCommand("styleWithCSS", false, "true");

      const heading = kind === "fore" ? colorTargetFromSelection() : null;
      if (heading && el.contains(heading)) {
        if (!color) {
          heading.style.removeProperty("color");
          heading.removeAttribute("data-custom-color");
        } else {
          heading.style.color = color;
          heading.setAttribute("data-custom-color", "true");
        }
        notifyEditorChanged(el);
        capture();
        return;
      }

      if (kind === "fore") {
        document.execCommand("foreColor", false, color || "#0b1f33");
      } else {
        const ok = document.execCommand("hiliteColor", false, color);
        if (!ok) document.execCommand("backColor", false, color);
      }
      notifyEditorChanged(el);
      capture();
    },
    [capture, restore, onError, colorTargetFromSelection],
  );

  async function onPickImages(files: FileList | null) {
    const pendingId = pendingUploadIdRef.current;
    const placeholder = targetFigureRef.current;
    if (!files?.length) {
      // User cancelled the OS picker.
      const scope = scopeRef.current;
      if (scope && pendingId) {
        scope
          .querySelectorAll(`[data-omicron-fig-id="${pendingId}"]`)
          .forEach((el) => el.removeAttribute("data-omicron-fig-id"));
      }
      if (
        scope &&
        placeholder &&
        scope.contains(placeholder) &&
        isEmptyImagePlaceholder(placeholder)
      ) {
        clearFigureSelection(scope);
      }
      pendingUploadIdRef.current = null;
      targetFigureRef.current = null;
      return;
    }
    targetFigureRef.current = null;
    const list = Array.from(files).filter((f) =>
      IMAGE_TYPES.includes(f.type),
    );
    if (!list.length) {
      onError?.("Choose a PNG, JPEG, WebP, GIF, or SVG image.");
      return;
    }
    setUploading(true);
    try {
      const uploaded: Array<{ url: string; caption: string }> = [];
      for (const file of list) {
        const data = await uploadFileDirect(file, {
          folder: "atlas/article-figures",
        });
        const caption = file.name.replace(/\.[^.]+$/, "") || "Figure";
        const fig: ManuscriptFigure = {
          id: `fig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: data.url,
          filename: file.name,
          caption,
        };
        onFigureAdded?.(fig);
        uploaded.push({ url: data.url, caption });
      }

      const scope = scopeRef.current;
      // Re-find the slot after blur/sanitize may have rewritten the DOM.
      const pinned =
        pendingId && scope
          ? scope.querySelector(`[data-omicron-fig-id="${pendingId}"]`)
          : null;
      const target =
        pinned instanceof HTMLElement && isEditableFigure(pinned)
          ? pinned
          : placeholder &&
              scope?.contains(placeholder) &&
              isEditableFigure(placeholder)
            ? placeholder
            : null;

      if (target) {
        applyImagesToFigure(target, uploaded);
        target.removeAttribute("data-omicron-fig-id");
        if (scope) clearFigureSelection(scope);
        const editor =
          activeEditorRef.current ??
          target.closest("[data-omicron-rich='true']");
        if (editor instanceof HTMLElement) notifyEditorChanged(editor);
        if (scope && target.isConnected) selectFigure(target, scope);
      } else {
        // No figure slot — insert at the caret saved before the picker opened.
        insertHtml(uploaded.map((u) => figureHtml(u.caption, u.url)).join(""));
        if (scope) clearFigureSelection(scope);
      }
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "Could not upload the image.",
      );
    } finally {
      pendingUploadIdRef.current = null;
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function insertLink() {
    const url = linkUrl.trim();
    if (!url || url === "https://") {
      onError?.("Enter a link URL.");
      return;
    }
    const label = linkLabel.trim() || url;
    insertHtml(
      `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noreferrer">${label}</a>`,
    );
    setLinkOpen(false);
    setLinkLabel("");
    setLinkUrl("https://");
  }

  const selectionToolbar =
    bubbleReady && bubble
      ? createPortal(
          <div
            ref={bubbleRef}
            data-selection-toolbar="true"
            className="pointer-events-auto fixed z-[9999] print:hidden"
            style={{
              top: bubble.top,
              left: bubble.left,
              transform: bubble.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            onPointerDownCapture={() => {
              keepBubbleRef.current = true;
              capture();
            }}
            onPointerUpCapture={() => {
              // Keep open through the click, then re-measure.
              window.setTimeout(() => {
                keepBubbleRef.current = false;
                updateBubble();
              }, 0);
            }}
            onMouseDown={(e) => {
              // Preserve the text selection when clicking toolbar chrome.
              if (
                e.target instanceof HTMLElement &&
                !e.target.closest("input, select, textarea, [contenteditable]")
              ) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex max-w-[min(94vw,520px)] flex-wrap items-center gap-0.5 rounded-xl border border-[var(--line)] bg-white px-1.5 py-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
              <ToolBtn title="Bold" onClick={() => run("bold")}>
                <span className="font-extrabold">B</span>
              </ToolBtn>
              <ToolBtn title="Italic" onClick={() => run("italic")}>
                <span className="italic">I</span>
              </ToolBtn>
              <ToolBtn title="Underline" onClick={() => run("underline")}>
                <span className="underline">U</span>
              </ToolBtn>
              <ToolBtn title="Strikethrough" onClick={() => run("strikeThrough")}>
                <span className="line-through">S</span>
              </ToolBtn>
              <Divider />
              <ToolBtn title="Decrease font size" onClick={() => bumpSize(-1)}>
                A−
              </ToolBtn>
              <ToolBtn title="Increase font size" onClick={() => bumpSize(1)}>
                A+
              </ToolBtn>
              <select
                className={`${selectClass} max-w-[4.75rem]`}
                defaultValue=""
                title="Font size"
                aria-label="Font size"
                onMouseDown={() => capture()}
                onChange={(e) => {
                  const size = e.target.value;
                  e.target.value = "";
                  if (size) {
                    setCustomSize(size === "0" ? "18" : size);
                    applySize(size);
                  }
                }}
              >
                {SIZE_OPTIONS.map((o) => (
                  <option key={`bubble-${o.label}`} value={o.value} disabled={!o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Divider />
              {TEXT_COLORS.slice(0, 6).map((c) => (
                <button
                  key={`bubble-fg-${c.value}`}
                  type="button"
                  title={`Text ${c.label}`}
                  className="h-5 w-5 rounded-sm border border-black/10"
                  style={{ background: c.value }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColor(c.value, "fore")}
                />
              ))}
              <label
                className="ml-0.5 flex h-6 w-6 cursor-pointer items-center overflow-hidden rounded-sm border border-[var(--line)]"
                title="Custom text color"
              >
                <input
                  type="color"
                  defaultValue="#0b1f33"
                  className="h-8 w-8 -translate-x-1 -translate-y-1 cursor-pointer"
                  onMouseDown={() => capture()}
                  onChange={(e) => applyColor(e.target.value, "fore")}
                />
              </label>
              <span className="mx-0.5 text-[10px] text-[var(--muted)]">Hi</span>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={`bubble-hi-${c.value}`}
                  type="button"
                  title={`Highlight ${c.label}`}
                  className="h-5 w-5 rounded-sm border border-black/10"
                  style={{ background: c.value }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColor(c.value, "back")}
                />
              ))}
              <Divider />
              <ToolBtn title="Clear formatting" onClick={() => run("removeFormat")}>
                Clear
              </ToolBtn>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
    <div
      className="sticky top-0 z-20 space-y-1.5 border border-[var(--line)] bg-white/95 px-2 py-2 shadow-sm backdrop-blur-sm print:hidden"
      style={
        journalPrimary
          ? ({ "--j-primary": journalPrimary } as CSSProperties)
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Format abstract &amp; body
        </p>
        <span className="text-[10px] text-[var(--muted)]">
          {uploading
            ? "Uploading image…"
            : "Click images to replace/delete · drag to move · click tables to edit"}
        </span>
      </div>
      <div className="-mx-1 flex flex-nowrap items-center gap-0.5 overflow-x-auto px-1 sm:flex-wrap sm:overflow-visible">
        <select
          className={selectClass}
          defaultValue=""
          title="Font family"
          aria-label="Font family"
          onMouseDown={() => capture()}
          onChange={(e) => {
            const font = e.target.value;
            e.target.value = "";
            if (font) applyFont(font);
          }}
        >
          {FONT_OPTIONS.map((o) => (
            <option key={o.label} value={o.value} disabled={!o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <ToolBtn title="Decrease font size" onClick={() => bumpSize(-1)}>
          A−
        </ToolBtn>
        <ToolBtn title="Increase font size" onClick={() => bumpSize(1)}>
          A+
        </ToolBtn>
        <ToolBtn
          title="Reset font size to default (0)"
          onClick={() => applySize("0")}
        >
          A0
        </ToolBtn>
        <select
          className={`${selectClass} max-w-[5.5rem]`}
          defaultValue=""
          title="Font size"
          aria-label="Font size"
          onMouseDown={() => capture()}
          onChange={(e) => {
            const size = e.target.value;
            e.target.value = "";
            if (size) {
              setCustomSize(size === "0" ? "18" : size);
              applySize(size);
            }
          }}
        >
          {SIZE_OPTIONS.map((o) => (
            <option key={o.label} value={o.value} disabled={!o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label
          className="flex h-7 items-center gap-1 rounded-md border border-[var(--line)] bg-white px-1.5 text-[11px] font-semibold text-[var(--ink)]"
          title="Custom font size in points (4–72)"
        >
          <span className="text-[var(--muted)]">pt</span>
          <input
            type="number"
            min={4}
            max={72}
            step={1}
            value={customSize}
            onMouseDown={() => capture()}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySize(customSize.trim() || "0");
              }
            }}
            className="w-10 border-0 bg-transparent p-0 text-[11px] font-semibold outline-none"
          />
          <button
            type="button"
            className="rounded px-1 text-[10px] text-[var(--accent)] hover:bg-[var(--surface)]"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applySize(customSize.trim() || "0")}
          >
            Set
          </button>
        </label>

        <Divider />
        <ToolBtn title="Bold" onClick={() => run("bold")}>
          <span className="font-extrabold">B</span>
        </ToolBtn>
        <ToolBtn title="Italic" onClick={() => run("italic")}>
          <span className="italic">I</span>
        </ToolBtn>
        <ToolBtn title="Underline" onClick={() => run("underline")}>
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn title="Strikethrough" onClick={() => run("strikeThrough")}>
          <span className="line-through">S</span>
        </ToolBtn>
        <ToolBtn title="Superscript" onClick={() => run("superscript")}>
          X²
        </ToolBtn>
        <ToolBtn title="Subscript" onClick={() => run("subscript")}>
          X₂
        </ToolBtn>
        <ToolBtn title="Clear formatting" onClick={() => run("removeFormat")}>
          Clear
        </ToolBtn>
        <ToolBtn title="Undo" onClick={() => run("undo")}>
          Undo
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => run("redo")}>
          Redo
        </ToolBtn>

        <Divider />
        <button
          type="button"
          title="Journal heading color"
          className="h-5 w-5 rounded-sm border border-black/15 ring-1 ring-black/5"
          style={{
            background: journalPrimary || "var(--j-primary, var(--accent))",
          }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyColor("", "fore")}
        />
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={`Text ${c.label}`}
            className="h-5 w-5 rounded-sm border border-black/10"
            style={{ background: c.value }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyColor(c.value, "fore")}
          />
        ))}
        <label
          className="ml-1 flex h-6 w-6 cursor-pointer items-center overflow-hidden rounded-sm border border-[var(--line)]"
          title="Custom text color"
        >
          <input
            type="color"
            defaultValue="#0b1f33"
            className="h-8 w-8 -translate-x-1 -translate-y-1 cursor-pointer"
            onMouseDown={() => capture()}
            onChange={(e) => applyColor(e.target.value, "fore")}
          />
        </label>
        <span className="mx-1 text-[10px] text-[var(--muted)]">Hi</span>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={`Highlight ${c.label}`}
            className="h-5 w-5 rounded-sm border border-black/10"
            style={{ background: c.value }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyColor(c.value, "back")}
          />
        ))}

        <Divider />
        <ToolBtn title="Align left" onClick={() => run("justifyLeft")}>
          Left
        </ToolBtn>
        <ToolBtn title="Align center" onClick={() => run("justifyCenter")}>
          Center
        </ToolBtn>
        <ToolBtn title="Align right" onClick={() => run("justifyRight")}>
          Right
        </ToolBtn>
        <ToolBtn title="Justify" onClick={() => run("justifyFull")}>
          Justify
        </ToolBtn>
        <ToolBtn title="Increase indent" onClick={() => run("indent")}>
          → Indent
        </ToolBtn>
        <ToolBtn title="Decrease indent" onClick={() => run("outdent")}>
          ← Outdent
        </ToolBtn>

        <Divider />
        <ToolBtn title="Paragraph" onClick={() => run("formatBlock", "<p>")}>
          ¶
        </ToolBtn>
        <ToolBtn title="Heading 1" onClick={() => run("formatBlock", "<h1>")}>
          H1
        </ToolBtn>
        <ToolBtn title="Heading 2" onClick={() => run("formatBlock", "<h2>")}>
          H2
        </ToolBtn>
        <ToolBtn title="Heading 3" onClick={() => run("formatBlock", "<h3>")}>
          H3
        </ToolBtn>
        <ToolBtn
          title="Block quote"
          onClick={() => run("formatBlock", "<blockquote>")}
        >
          Quote
        </ToolBtn>
        <ToolBtn
          title="Bullet list"
          onClick={() => run("insertUnorderedList")}
        >
          • List
        </ToolBtn>
        <ToolBtn
          title="Numbered list"
          onClick={() => run("insertOrderedList")}
        >
          1. List
        </ToolBtn>

        <Divider />
        <ToolBtn
          title="Insert / edit link"
          active={linkOpen}
          onClick={() => {
            setLinkOpen((o) => !o);
            setTableOpen(false);
          }}
        >
          Link
        </ToolBtn>
        <ToolBtn
          title="Insert a professional table"
          active={tableOpen}
          onClick={() => {
            setLinkOpen(false);
            targetTableRef.current = null;
            setTableUpdateMode(false);
            setTableSeed({
              headers: ["Column 1", "Column 2", "Column 3"],
              rows: [
                ["", "", ""],
                ["", "", ""],
                ["", "", ""],
              ],
              caption: "Table 1.",
              fullWidth: true,
              orientation: "normal",
              supplementary: false,
            });
            setTableEditorKey((k) => k + 1);
            setTableOpen((o) => !o);
          }}
        >
          Table
        </ToolBtn>
        <ToolBtn
          title="Add image at the cursor (or click a Select image slot in the body)"
          disabled={uploading}
          onClick={() => {
            capture();
            pendingUploadIdRef.current = null;
            targetFigureRef.current = null;
            // Only fill a slot if the caret is already inside that empty figure.
            const sel = window.getSelection();
            const node = sel?.anchorNode;
            const start =
              node instanceof Element ? node : node?.parentElement;
            const fig = start?.closest("figure") ?? null;
            const scope = scopeRef.current;
            if (
              fig instanceof HTMLElement &&
              scope?.contains(fig) &&
              (isEmptyImagePlaceholder(fig) || !fig.querySelector(":scope > img"))
            ) {
              const id = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
              fig.setAttribute("data-omicron-fig-id", id);
              pendingUploadIdRef.current = id;
              targetFigureRef.current = fig;
              const editor = fig.closest("[data-omicron-rich='true']");
              if (editor instanceof HTMLElement) activeEditorRef.current = editor;
            }
            fileInputRef.current?.click();
          }}
        >
          {uploading ? "Uploading…" : "Image"}
        </ToolBtn>
        <ToolBtn
          title="Horizontal rule"
          onClick={() => insertHtml("<hr /><p><br></p>")}
        >
          ―
        </ToolBtn>
        <input
          id={fileId}
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => void onPickImages(e.target.files)}
        />
      </div>
      {linkOpen ? (
        <div className="flex flex-wrap items-end gap-2 border-t border-[var(--line)] bg-[var(--surface)]/40 px-1 py-2">
          <label className="min-w-[120px] flex-1 text-[11px] text-[var(--muted)]">
            Label
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Link text"
              className="mt-0.5 block w-full rounded border border-[var(--line)] px-2 py-1.5 text-xs"
            />
          </label>
          <label className="min-w-[180px] flex-[2] text-[11px] text-[var(--muted)]">
            URL
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="mt-0.5 block w-full rounded border border-[var(--line)] px-2 py-1.5 text-xs"
            />
          </label>
          <button
            type="button"
            className="btn-secondary !px-2.5 !py-1.5 text-[11px]"
            onClick={insertLink}
          >
            Insert link
          </button>
        </div>
      ) : null}
      {tableOpen ? (
        <div className="border-t border-[var(--line)] bg-[var(--surface)]/35 px-1 py-2">
          <WordTableEditor
            key={tableEditorKey}
            initial={tableSeed}
            updateMode={tableUpdateMode}
            onCancel={() => {
              setTableOpen(false);
              setTableUpdateMode(false);
              targetTableRef.current = null;
            }}
            onInsert={(html) => {
              const target = targetTableRef.current;
              const scope = scopeRef.current;
              if (tableUpdateMode && target && scope?.contains(target)) {
                const tmp = document.createElement("div");
                tmp.innerHTML = html;
                const next = tmp.firstElementChild;
                if (next) {
                  const figure =
                    target.tagName === "FIGURE"
                      ? target
                      : target.closest("figure");
                  if (figure) figure.replaceWith(next);
                  else {
                    const wrap = target.classList.contains("omicron-table-wrap")
                      ? target
                      : ((target.closest(".omicron-table-wrap") as HTMLElement | null) ??
                        target);
                    const prev = wrap.previousElementSibling;
                    if (
                      prev &&
                      /^table(?:\s+\d+)?(?:[.:]|\s|$)/i.test(
                        prev.textContent?.trim() ?? "",
                      )
                    ) {
                      prev.remove();
                    }
                    wrap.replaceWith(next);
                  }
                  const editor =
                    activeEditorRef.current ??
                    (next instanceof HTMLElement
                      ? next.closest("[data-omicron-rich='true']")
                      : null);
                  if (editor instanceof HTMLElement) notifyEditorChanged(editor);
                }
              } else {
                insertHtml(`${html}<p><br></p>`);
              }
              setTableOpen(false);
              setTableUpdateMode(false);
              targetTableRef.current = null;
            }}
          />
        </div>
      ) : null}
    </div>
    {selectionToolbar}
    </>
  );
}

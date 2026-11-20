/** Shared figure selection + drag chrome for in-template / manuscript editors. */

const DROP_ATTR = "data-omicron-drop";

export function isEditableFigure(figure: Element | null): figure is HTMLElement {
  if (!(figure instanceof HTMLElement) || figure.tagName !== "FIGURE") {
    return false;
  }
  if (figure.querySelector("table, .omicron-table-wrap")) return false;
  if (figure.classList.contains("table-full")) return false;
  return true;
}

export function isEmptyImagePlaceholder(figure: Element | null): boolean {
  if (!isEditableFigure(figure)) return false;
  if (figure.querySelector("img")) return false;
  if (figure.classList.contains("figure-full")) return true;
  const cap = figure.querySelector("figcaption")?.textContent ?? "";
  return /^\s*figure\b/i.test(cap);
}

export function clearFigureSelection(root: HTMLElement | null | Document) {
  const scope: ParentNode = root ?? document;
  scope.querySelectorAll("figure.omicron-fig-selected").forEach((fig) => {
    fig.classList.remove("omicron-fig-selected");
    fig.removeAttribute("draggable");
    fig.removeAttribute("contenteditable");
    fig
      .querySelectorAll("figcaption[contenteditable]")
      .forEach((cap) => cap.removeAttribute("contenteditable"));
    fig.querySelectorAll(".omicron-fig-chrome").forEach((n) => n.remove());
  });
  clearDropMarkers(scope);
}

export function clearDropMarkers(root: ParentNode) {
  root.querySelectorAll(`[${DROP_ATTR}]`).forEach((el) => {
    el.removeAttribute(DROP_ATTR);
  });
  root.querySelectorAll(".omicron-fig-dragging").forEach((el) => {
    el.classList.remove("omicron-fig-dragging");
  });
}

/**
 * Show Replace / Delete / Cancel over a figure.
 * Selected figures are draggable so they can be moved in the article body.
 */
export function selectFigure(
  figure: HTMLElement,
  root: HTMLElement,
  options?: { extraActionsHtml?: string; draggable?: boolean },
) {
  clearFigureSelection(root);
  figure.classList.add("omicron-fig-selected");
  // Disable editing on the figure shell so HTML5 drag works inside contentEditable.
  figure.contentEditable = "false";
  const caption = figure.querySelector("figcaption");
  if (caption instanceof HTMLElement) caption.contentEditable = "true";
  if (options?.draggable !== false) {
    figure.setAttribute("draggable", "true");
  }
  if (figure.querySelector(":scope > .omicron-fig-chrome")) return;

  const chrome = document.createElement("div");
  chrome.className = "omicron-fig-chrome";
  chrome.contentEditable = "false";
  chrome.setAttribute("data-omicron-ui", "1");
  chrome.setAttribute("draggable", "false");

  const bar = document.createElement("div");
  bar.className = "omicron-fig-toolbar";
  bar.innerHTML =
    '<button type="button" data-fig-action="replace">Replace</button>' +
    '<button type="button" data-fig-action="delete">Delete</button>' +
    '<button type="button" data-fig-action="cancel">Cancel</button>' +
    '<span data-fig-hint="1">Drag to move</span>' +
    (options?.extraActionsHtml ?? "");
  chrome.appendChild(bar);
  figure.appendChild(chrome);
}

/** Closest block-level sibling target inside a rich editor for drop placement. */
export function closestDropBlock(
  node: Node | null,
  editor: HTMLElement,
  dragged?: HTMLElement | null,
): HTMLElement | null {
  let el: Element | null =
    node instanceof Element ? node : node?.parentElement ?? null;
  while (el && el !== editor) {
    if (
      el.parentElement === editor &&
      el instanceof HTMLElement &&
      el !== dragged &&
      !el.classList.contains("omicron-fig-chrome")
    ) {
      const tag = el.tagName;
      if (
        /^(P|H1|H2|H3|H4|FIGURE|UL|OL|BLOCKQUOTE|TABLE|HR|SECTION|DIV)$/.test(
          tag,
        )
      ) {
        return el;
      }
    }
    el = el.parentElement;
  }
  return null;
}

export function setDropMarker(
  target: HTMLElement | null,
  place: "before" | "after" | null,
) {
  const root = target?.getRootNode();
  const scope =
    root instanceof Document || root instanceof DocumentFragment
      ? root
      : document;
  clearDropMarkers(scope);
  if (!target || !place) return;
  target.setAttribute(DROP_ATTR, place);
}

export function moveFigureRelativeTo(
  figure: HTMLElement,
  target: HTMLElement,
  place: "before" | "after",
): boolean {
  if (figure === target) return false;
  if (figure.contains(target) || target.contains(figure)) return false;
  if (!target.parentElement) return false;
  if (place === "before") {
    target.parentElement.insertBefore(figure, target);
  } else {
    target.after(figure);
  }
  return true;
}

/** Remove editor-only chrome before persisting HTML. */
export function stripFigureChromeHtml(html: string): string {
  return html
    .replace(
      /<div\b[^>]*class="[^"]*\bomicron-fig-chrome\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      "",
    )
    .replace(/\s*\bomicron-fig-selected\b/gi, "")
    .replace(/\s*\bomicron-fig-dragging\b/gi, "")
    .replace(/\s*draggable="[^"]*"/gi, "")
    .replace(/\s*data-omicron-drop="[^"]*"/gi, "")
    .replace(/\s*class="\s*"/gi, "");
}

export function rotationSize(width: number, height: number) {
  return Math.ceil(Math.hypot(width, height)) + 2;
}

export function shortestHeadingDelta(from: number, to: number) {
  return ((to - from) % 360 + 540) % 360 - 180;
}

// Rotate Google's raster drawing surface, including its overlays, while leaving
// the SDK's controls, logo and attribution upright and inside the visible area.
// The oversized square supplies tiles at the corners at every heading.
export function createRasterMapRotation(container: HTMLDivElement, viewport: HTMLDivElement, resizeMap: () => void) {
  let heading = 0;
  let surface: HTMLElement | null = null;
  let active = false;
  let side = 0;
  let width = 0;
  let height = 0;
  let layoutFrame: number | null = null;
  const originals = new Map<HTMLElement, { transform: string; rotate: string; transformOrigin: string; maxWidth: string }>();
  const remember = (element: HTMLElement) => {
    if (!originals.has(element)) originals.set(element, {
      transform: element.style.transform,
      rotate: element.style.rotate,
      transformOrigin: element.style.transformOrigin,
      maxWidth: element.style.maxWidth,
    });
  };
  const restore = () => {
    originals.forEach((style, element) => {
      // Google's drawing surface owns its transform (including pan offsets).
      if (element === surface) {
        element.style.rotate = style.rotate;
        element.style.transformOrigin = style.transformOrigin;
      } else Object.assign(element.style, style);
    });
    originals.clear();
  };
  const layout = () => {
    if (!active) return;
    const root = container.querySelector<HTMLElement>(".gm-style");
    const candidate = root?.firstElementChild;
    if (!(candidate instanceof HTMLElement)) return;
    surface = candidate;
    remember(surface);
    surface.style.transformOrigin = "50% 50%";
    surface.style.rotate = `${-heading}deg`;
    const padX = (side - width) / 2, padY = (side - height) / 2;
    for (const node of Array.from(root!.children)) {
      if (!(node instanceof HTMLElement) || node === surface || getComputedStyle(node).position !== "absolute") continue;
      // Full-size SDK interaction layers must retain their original geometry.
      if (node.offsetWidth >= side - 2 && node.offsetHeight >= side - 2) continue;
      remember(node);
      node.style.maxWidth = `${width}px`;
      const x = node.offsetLeft, y = node.offsetTop;
      const visibleX = Math.max(0, Math.min(width - node.offsetWidth, x > side / 2 ? x - 2 * padX : x));
      const visibleY = Math.max(0, Math.min(height - node.offsetHeight, y > side / 2 ? y - 2 * padY : y));
      node.style.transform = `translate(${padX + visibleX - x}px, ${padY + visibleY - y}px) ${originals.get(node)!.transform}`;
    }
  };
  const measure = () => {
    if (!active) return;
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    side = rotationSize(width, height);
    Object.assign(container.style, {
      inset: "auto", left: `${(width - side) / 2}px`, top: `${(height - side) / 2}px`,
      width: `${side}px`, height: `${side}px`,
    });
    resizeMap();
    layout();
  };
  const reset = () => {
    if (!active) return;
    active = false;
    heading = 0;
    restore();
    surface = null;
    Object.assign(container.style, { inset: "0px", left: "0px", top: "0px", width: "", height: "" });
    resizeMap();
  };
  const scheduleLayout = () => {
    if (!active || layoutFrame !== null) return;
    layoutFrame = requestAnimationFrame(() => { layoutFrame = null; layout(); });
  };
  const observer = new MutationObserver(scheduleLayout);
  observer.observe(container, { childList: true, subtree: true });
  const sizeObserver = new ResizeObserver(measure);
  sizeObserver.observe(viewport);
  return {
    setHeading(value: number) {
      heading = value;
      if (!active) { active = true; measure(); }
      else if (surface) surface.style.rotate = `${-heading}deg`;
      else layout();
    },
    refresh: scheduleLayout,
    reset,
    dispose() {
      observer.disconnect(); sizeObserver.disconnect();
      if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
      reset();
    },
  };
}

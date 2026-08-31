import { useRef, useState } from "react";

const THRESHOLD = 72;

export default function SwipeableExpenseItem({ onDelete, onDuplicate, children, className = "" }) {
  const startX = useRef(0);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  function reset() {
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  }

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
    setAnimating(false);
  }

  function onTouchMove(e) {
    if (!dragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    setOffset(Math.max(-THRESHOLD * 1.4, Math.min(THRESHOLD * 1.4, delta)));
  }

  function onTouchEnd() {
    dragging.current = false;
    if (offset <= -THRESHOLD) {
      onDelete?.();
      reset();
      return;
    }
    if (offset >= THRESHOLD) {
      onDuplicate?.();
      reset();
      return;
    }
    reset();
  }

  const deleteActive = offset < -24;
  const duplicateActive = offset > 24;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-jade-soft text-xs font-bold text-jade-deep transition-opacity ${duplicateActive ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        複製
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-coral/15 text-xs font-bold text-coral transition-opacity ${deleteActive ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        刪除
      </div>
      <div
        className={`relative bg-white ${animating ? "transition-transform duration-200" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

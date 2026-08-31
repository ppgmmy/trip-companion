export default function UndoToast({ message, onUndo, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-jade px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-soft)]">
      <span className="min-w-0 truncate">✓ {message}</span>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold transition active:scale-95"
        >
          還原
        </button>
      )}
      {onDismiss && !onUndo && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs font-bold text-white/80">
          ✕
        </button>
      )}
    </div>
  );
}

import { useState } from "react";
import { CAFE_TAGS } from "../data";

export default function CafeLogTab({ cafes, setCafes }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);

  function toggleTag(id) {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function submit(e) {
    e.preventDefault();
    if (!rating) {
      alert("請先選擇 1–5 星");
      return;
    }
    setCafes((prev) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        area: area.trim(),
        rating,
        tags: [...tags],
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setName("");
    setArea("");
    setRating(0);
    setTags([]);
  }

  function remove(id) {
    setCafes((prev) => prev.filter((c) => c.id !== id));
  }

  const sorted = [...cafes].sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">咖啡店足跡</h2>
        <p className="text-sm text-ink-soft">原宿／澀谷 Cafe · 依評分排序</p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white/85 p-4 shadow-[var(--shadow-soft)]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">店名</span>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：Cat Street 某間"
            className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">區域</span>
          <input
            required
            maxLength={30}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            list="tokyo-areas"
            placeholder="原宿 / 澀谷 / 秋葉原…"
            className="w-full min-h-12 rounded-2xl border border-rose-soft bg-mist px-4 outline-none ring-rose-brand focus:ring-2"
          />
          <datalist id="tokyo-areas">
            <option value="原宿" />
            <option value="澀谷" />
            <option value="Cat Street" />
            <option value="表參道" />
            <option value="秋葉原" />
            <option value="新宿" />
          </datalist>
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-ink">星級評分</legend>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`star-btn min-h-11 min-w-11 rounded-2xl text-lg transition ${n <= rating ? "is-on" : "bg-mist text-ink-faint"}`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-ink">特色標籤</legend>
          <div className="flex flex-wrap gap-2">
            {CAFE_TAGS.map((tag) => (
              <label
                key={tag.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-rose-soft bg-mist px-3 text-sm font-medium"
              >
                <input
                  type="checkbox"
                  checked={tags.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  className="accent-rose-brand"
                />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="flex w-full min-h-12 items-center justify-center rounded-2xl bg-rose-brand text-base font-bold text-white shadow-[var(--shadow-soft)] active:scale-[0.98]"
        >
          加入足跡
        </button>
      </form>

      <p className="font-display text-xl font-bold text-ink">{sorted.length} 間</p>
      <ul className="space-y-2">
        {!sorted.length && (
          <li className="rounded-2xl border border-dashed border-rose-soft bg-white/50 px-4 py-8 text-center text-sm text-ink-faint">
            還沒有足跡，從 Cat Street 第一杯開始吧。
          </li>
        )}
        {sorted.map((cafe) => (
          <li key={cafe.id} className="rounded-2xl bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-ink">{cafe.name}</h3>
                  <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[10px] font-semibold text-teal">
                    {cafe.area}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold tracking-wide text-rose-brand">
                  {"★".repeat(cafe.rating)}
                  {"☆".repeat(5 - cafe.rating)}
                </p>
                {cafe.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cafe.tags.map((id) => {
                      const def = CAFE_TAGS.find((t) => t.id === id);
                      return def ? (
                        <span key={id} className={`tag-badge ${def.badge}`}>
                          {def.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(cafe.id)}
                className="min-h-10 min-w-10 rounded-xl text-ink-faint hover:bg-rose-soft"
                aria-label="刪除"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

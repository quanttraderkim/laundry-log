"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Shirt,
  Sparkles,
  WashingMachine,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type ClothingItem = {
  id: number;
  name: string;
  category: string;
  washedAt: string;
  wearCount: number;
};

const seedItems: ClothingItem[] = [
  {
    id: 1,
    name: "출근용 흰 셔츠",
    category: "상의",
    washedAt: "2026-05-18",
    wearCount: 1,
  },
  {
    id: 2,
    name: "러닝 반팔",
    category: "운동복",
    washedAt: "2026-05-15",
    wearCount: 2,
  },
  {
    id: 3,
    name: "데님 팬츠",
    category: "하의",
    washedAt: "2026-05-10",
    wearCount: 4,
  },
];

const today = new Date("2026-05-19T09:00:00+09:00");

function daysSince(date: string) {
  const washedAt = new Date(`${date}T00:00:00+09:00`);
  return Math.max(
    0,
    Math.floor((today.getTime() - washedAt.getTime()) / 86_400_000),
  );
}

function statusFor(item: ClothingItem) {
  const days = daysSince(item.washedAt);

  if (days >= 7 || item.wearCount >= 4) {
    return {
      label: "세탁 권장",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    };
  }

  if (days >= 3 || item.wearCount >= 2) {
    return {
      label: "곧 세탁",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    label: "깨끗함",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  };
}

export default function Home() {
  const [items, setItems] = useState(seedItems);
  const [filter, setFilter] = useState<"all" | "needsWash" | "fresh">("all");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("상의");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = statusFor(item).label;

      if (filter === "needsWash") {
        return status !== "깨끗함";
      }

      if (filter === "fresh") {
        return status === "깨끗함";
      }

      return true;
    });
  }, [filter, items]);

  const needsWashCount = items.filter(
    (item) => statusFor(item).label === "세탁 권장",
  ).length;

  function markWashed(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, washedAt: "2026-05-19", wearCount: 0 }
          : item,
      ),
    );
  }

  function addWear(id: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, wearCount: item.wearCount + 1 } : item,
      ),
    );
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      return;
    }

    setItems((current) => [
      {
        id: Date.now(),
        name,
        category: newCategory,
        washedAt: "2026-05-19",
        wearCount: 0,
      },
      ...current,
    ]);
    setNewName("");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-[#17211c]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5">
        <header className="flex items-center justify-between pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">WashLog</p>
            <h1 className="mt-1 text-[28px] font-semibold leading-9">
              마지막 세탁일 확인
            </h1>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17211c] text-white">
            <WashingMachine aria-hidden="true" size={24} />
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2" aria-label="오늘 상태 요약">
          <div className="rounded-2xl border border-emerald-100 bg-white p-3">
            <Sparkles aria-hidden="true" className="text-emerald-600" size={18} />
            <p className="mt-3 text-2xl font-semibold">{items.length}</p>
            <p className="text-xs font-medium text-zinc-500">등록한 옷</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-3">
            <Clock3 aria-hidden="true" className="text-amber-600" size={18} />
            <p className="mt-3 text-2xl font-semibold">{needsWashCount}</p>
            <p className="text-xs font-medium text-zinc-500">세탁 권장</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-3">
            <CalendarDays aria-hidden="true" className="text-rose-600" size={18} />
            <p className="mt-3 text-2xl font-semibold">1초</p>
            <p className="text-xs font-medium text-zinc-500">기록 시간</p>
          </div>
        </section>

        <form
          onSubmit={addItem}
          className="mt-5 rounded-2xl border border-zinc-200 bg-white p-3"
        >
          <label className="text-sm font-semibold" htmlFor="new-clothing-name">
            옷 추가
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_78px_44px] gap-2">
            <input
              id="new-clothing-name"
              className="h-11 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="예: 검정 후드"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <select
              className="h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-2 text-sm outline-none transition focus:border-emerald-500"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              aria-label="옷 종류"
            >
              <option>상의</option>
              <option>하의</option>
              <option>운동복</option>
              <option>아우터</option>
            </select>
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
              aria-label="옷 추가"
            >
              <Plus aria-hidden="true" size={20} />
            </button>
          </div>
        </form>

        <nav className="mt-5 grid grid-cols-3 rounded-2xl bg-zinc-200 p-1">
          {[
            ["all", "전체"],
            ["needsWash", "관리 필요"],
            ["fresh", "깨끗함"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key as typeof filter)}
              className={`h-10 rounded-xl text-sm font-semibold transition ${
                filter === key ? "bg-white text-[#17211c]" : "text-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="mt-4 flex flex-1 flex-col gap-3 pb-6">
          {filteredItems.map((item) => {
            const status = statusFor(item);
            const days = daysSince(item.washedAt);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                      <Shirt aria-hidden="true" size={21} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold leading-6">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {item.category} · {days}일 전 세탁 · {item.wearCount}회 착용
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.tone}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => addWear(item.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Clock3 aria-hidden="true" size={17} />
                    오늘 입음
                  </button>
                  <button
                    type="button"
                    onClick={() => markWashed(item.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17211c] text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    <CheckCircle2 aria-hidden="true" size={17} />
                    세탁 완료
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}

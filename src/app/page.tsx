"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Droplets,
  MessageCircle,
  Plus,
  Shirt,
  Sparkles,
  TriangleAlert,
  WashingMachine,
  Wind,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CareProfile =
  | "active_synthetic"
  | "cotton_top"
  | "denim"
  | "seasonal_outer"
  | "standard_outer"
  | "wool_delicate";

type ConditionFlag = "sweat" | "odor" | "stain";

type ClothingItem = {
  id: number;
  name: string;
  brand: string;
  color: string;
  feature: string;
  size: string;
  category: string;
  material: string;
  careProfile: CareProfile;
  washedAt: string;
  wornAt?: string;
  maintainedAt?: string;
  wearCount: number;
  flags: ConditionFlag[];
};

type Status = {
  label: "깨끗함" | "곧 세탁" | "세탁 권장" | "통풍 권장";
  reason: string;
  tone: string;
  dot: string;
};

const todayText = "2026-05-19";
const today = new Date(`${todayText}T09:00:00+09:00`);
const legacyItemsStorageKey = "washlog-items-v1";
const legacyCountStorageKey = "washlog-today-log-count-v1";
const itemsStorageKey = "washlog-items-v2";
const countStorageKey = "washlog-today-log-count-v2";

const conditionMeta: Record<
  ConditionFlag,
  { label: string; icon: typeof Droplets }
> = {
  sweat: { label: "땀남", icon: Droplets },
  odor: { label: "냄새", icon: Wind },
  stain: { label: "얼룩", icon: TriangleAlert },
};

const seedItems: ClothingItem[] = [
  {
    id: 1,
    name: "러닝 반팔",
    brand: "나이키",
    color: "검정",
    feature: "메시 패널",
    size: "M",
    category: "운동복",
    material: "폴리에스터",
    careProfile: "active_synthetic",
    washedAt: "2026-05-18",
    wornAt: "2026-05-19",
    wearCount: 1,
    flags: ["sweat"],
  },
  {
    id: 2,
    name: "러닝 반팔",
    brand: "나이키",
    color: "검정",
    feature: "메시 패널",
    size: "L",
    category: "운동복",
    material: "폴리에스터",
    careProfile: "active_synthetic",
    washedAt: "2026-05-19",
    wearCount: 0,
    flags: [],
  },
  {
    id: 3,
    name: "출근용 셔츠",
    brand: "유니클로",
    color: "흰색",
    feature: "옥스포드",
    size: "M",
    category: "상의",
    material: "면",
    careProfile: "cotton_top",
    washedAt: "2026-05-18",
    wornAt: "2026-05-18",
    wearCount: 1,
    flags: [],
  },
  {
    id: 4,
    name: "울 니트",
    brand: "무지",
    color: "네이비",
    feature: "라운드넥",
    size: "M",
    category: "니트",
    material: "울",
    careProfile: "wool_delicate",
    washedAt: "2026-05-05",
    wornAt: "2026-05-18",
    maintainedAt: "2026-05-18",
    wearCount: 1,
    flags: [],
  },
  {
    id: 5,
    name: "데님 팬츠",
    brand: "리바이스",
    color: "중청",
    feature: "스트레이트",
    size: "30",
    category: "하의",
    material: "데님",
    careProfile: "denim",
    washedAt: "2026-05-10",
    wornAt: "2026-05-18",
    wearCount: 3,
    flags: [],
  },
  {
    id: 6,
    name: "울 코트",
    brand: "시스템",
    color: "차콜",
    feature: "롱 코트",
    size: "M",
    category: "아우터",
    material: "울",
    careProfile: "seasonal_outer",
    washedAt: "2026-01-20",
    wornAt: "2026-05-10",
    wearCount: 12,
    flags: [],
  },
];

function daysSince(date?: string) {
  if (!date) {
    return null;
  }

  const targetDate = new Date(`${date}T00:00:00+09:00`);
  return Math.max(
    0,
    Math.floor((today.getTime() - targetDate.getTime()) / 86_400_000),
  );
}

function calendarDate(date?: string) {
  return date ? date.replace(/-/g, ".") : "기록 없음";
}

function relativeDate(date?: string) {
  const days = daysSince(date);

  if (days === null) {
    return null;
  }

  if (days === 0) {
    return "오늘";
  }

  return `${days}일 전`;
}

function calendarDateSummary(date?: string) {
  const relative = relativeDate(date);

  return relative ? `${calendarDate(date)} · ${relative}` : calendarDate(date);
}

function statusFor(item: ClothingItem): Status {
  const laundryDays = daysSince(item.washedAt) ?? 0;

  if (item.flags.includes("stain")) {
    return status("세탁 권장", "얼룩 기록 있음", "rose");
  }

  if (item.flags.includes("sweat") || item.flags.includes("odor")) {
    return status("세탁 권장", "땀/냄새 기록 있음", "rose");
  }

  if (item.careProfile === "active_synthetic") {
    if (item.wearCount >= 1) {
      return status("세탁 권장", "폴리에스터 운동복은 1회 착용 후 세탁", "rose");
    }
    return status("깨끗함", "세탁 후 착용 기록 없음", "emerald");
  }

  if (item.careProfile === "wool_delicate") {
    if (item.wearCount >= 1) {
      return status("통풍 권장", "울 소재는 세탁보다 통풍 우선", "sky");
    }
    return status("깨끗함", "통풍 관리 완료", "emerald");
  }

  if (item.careProfile === "denim") {
    if (item.wearCount >= 4 || laundryDays >= 14) {
      return status("세탁 권장", "데님 착용/일수 기준 초과", "rose");
    }
    if (item.wearCount >= 3) {
      return status("곧 세탁", "데님 3회 착용, 상태 점검", "amber");
    }
    return status("깨끗함", "착용 횟수 기준 여유 있음", "emerald");
  }

  if (item.careProfile === "seasonal_outer") {
    if (item.wearCount >= 10 || laundryDays >= 90) {
      return status("곧 세탁", "시즌 종료 세탁/드라이 점검", "amber");
    }
    if (item.wearCount >= 1) {
      return status("통풍 권장", "착용 후 통풍, 시즌 종료 관리", "sky");
    }
    return status("깨끗함", "시즌 종료 관리 대상", "emerald");
  }

  if (item.careProfile === "cotton_top") {
    if (item.wearCount >= 2) {
      return status("세탁 권장", "피부 접촉 의류 2회 착용", "rose");
    }
    if (item.wearCount >= 1) {
      return status("곧 세탁", "면 셔츠 1회 착용", "amber");
    }
    return status("깨끗함", "세탁 후 착용 기록 없음", "emerald");
  }

  if (item.wearCount >= 3 || laundryDays >= 7) {
    return status("세탁 권장", "착용 횟수/마지막 세탁일 기준", "rose");
  }

  if (item.wearCount >= 2 || laundryDays >= 4) {
    return status("곧 세탁", "기본 관리 기준 근접", "amber");
  }

  return status("깨끗함", "착용 횟수 기준 여유 있음", "emerald");
}

function status(label: Status["label"], reason: string, color: string): Status {
  const tones = {
    amber: {
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    emerald: {
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
    rose: {
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    },
    sky: {
      tone: "border-sky-200 bg-sky-50 text-sky-700",
      dot: "bg-sky-500",
    },
  } as const;

  return { label, reason, ...tones[color as keyof typeof tones] };
}

function profileFor(category: string, material: string): CareProfile {
  if (category === "운동복") {
    return "active_synthetic";
  }

  if (category === "아우터") {
    return "seasonal_outer";
  }

  if (material === "폴리에스터") {
    return "active_synthetic";
  }

  if (material === "울") {
    return "wool_delicate";
  }

  if (material === "데님") {
    return "denim";
  }

  if (material === "면") {
    return "cotton_top";
  }

  return "standard_outer";
}

function cleanText(value?: string) {
  return (value ?? "").trim();
}

function normalizeText(value?: string) {
  return cleanText(value).toLowerCase().replace(/\s/g, "");
}

function textTokens(value?: string) {
  return cleanText(value)
    .split(/\s+/)
    .map(normalizeText)
    .filter(Boolean);
}

function colorAliases(color?: string) {
  const cleanedColor = cleanText(color);
  return Array.from(
    new Set([cleanedColor, cleanedColor.replace(/색$/, "")].map(normalizeText)),
  ).filter(Boolean);
}

function identityParts(item: ClothingItem) {
  return [item.brand, item.color, item.feature, item.size]
    .map(cleanText)
    .filter(Boolean);
}

function itemTitle(item: ClothingItem) {
  return item.brand ? `${item.brand} ${item.name}` : item.name;
}

function itemDetailParts(item: ClothingItem) {
  return [item.color, item.feature, item.size].map(cleanText).filter(Boolean);
}

function itemDisplayName(item: ClothingItem) {
  const details = itemDetailParts(item);
  return details.length > 0
    ? `${itemTitle(item)} · ${details.join(" · ")}`
    : itemTitle(item);
}

function identityKeyFor(item: Pick<
  ClothingItem,
  "name" | "brand" | "color" | "feature" | "size"
>) {
  return [item.name, item.brand, item.color, item.feature, item.size]
    .map(normalizeText)
    .join("|");
}

function hasConditionFlags(item: ClothingItem) {
  return item.flags.length > 0;
}

function wearSummary(item: ClothingItem) {
  if (item.careProfile === "seasonal_outer" && !hasConditionFlags(item)) {
    return `시즌 관리 기준 · ${item.wearCount}회 착용`;
  }

  return hasConditionFlags(item)
    ? `세탁 필요 상태 · ${item.wearCount}회 착용`
    : `${item.wearCount}회 착용`;
}

function isConditionFlag(value: string): value is ConditionFlag {
  return value === "sweat" || value === "odor" || value === "stain";
}

function normalizeItem(item: Partial<ClothingItem>, index: number): ClothingItem {
  const category = cleanText(item.category) || "상의";
  const material = cleanText(item.material) || "면";
  const wearCount = typeof item.wearCount === "number" ? item.wearCount : 0;
  const flags = Array.isArray(item.flags)
    ? item.flags.filter((flag): flag is ConditionFlag => isConditionFlag(flag))
    : [];

  return {
    id: typeof item.id === "number" ? item.id : Date.now() + index,
    name: cleanText(item.name) || "이름 없는 옷",
    brand: cleanText(item.brand),
    color: cleanText(item.color),
    feature: cleanText(item.feature),
    size: cleanText(item.size),
    category,
    material,
    careProfile: profileFor(category, material),
    washedAt: item.washedAt ?? todayText,
    wornAt: item.wornAt ?? (wearCount > 0 ? todayText : undefined),
    maintainedAt: item.maintainedAt,
    wearCount,
    flags,
  };
}

function withDemoOuter(items: ClothingItem[]) {
  const demoOuter = seedItems.find((item) => item.careProfile === "seasonal_outer");
  const hasOuter = items.some(
    (item) => item.category === "아우터" || item.careProfile === "seasonal_outer",
  );

  return hasOuter || !demoOuter ? items : [...items, demoOuter];
}

function loadStoredItems() {
  const storedItems =
    window.localStorage.getItem(itemsStorageKey) ??
    window.localStorage.getItem(legacyItemsStorageKey);

  if (!storedItems) {
    return seedItems;
  }

  try {
    const parsedItems = JSON.parse(storedItems);
    return Array.isArray(parsedItems)
      ? withDemoOuter(parsedItems.map((item, index) => normalizeItem(item, index)))
      : seedItems;
  } catch {
    return seedItems;
  }
}

function matchScore(item: ClothingItem, text: string) {
  const normalized = normalizeText(text);
  let score = 0;
  let hasNameSignal = false;
  let identitySignalCount = 0;

  if (normalized.includes(normalizeText(item.name))) {
    score += 8;
    hasNameSignal = true;
  }

  const matchingNameTokenCount = textTokens(item.name).filter((token) =>
    normalized.includes(token),
  ).length;
  score += matchingNameTokenCount * 2;
  hasNameSignal = hasNameSignal || matchingNameTokenCount > 0;

  if (item.brand && normalized.includes(normalizeText(item.brand))) {
    score += 4;
    identitySignalCount += 1;
  }
  if (colorAliases(item.color).some((color) => normalized.includes(color))) {
    score += 4;
    identitySignalCount += 1;
  }
  if (item.size && normalized.includes(normalizeText(item.size))) {
    score += 4;
    identitySignalCount += 1;
  }

  const matchingFeatureTokenCount = textTokens(item.feature).filter((token) =>
    normalized.includes(token),
  ).length;
  score += matchingFeatureTokenCount * 3;
  if (matchingFeatureTokenCount > 0) {
    identitySignalCount += 1;
  }

  if (normalized.includes(normalizeText(item.category))) score += 1;
  if (normalized.includes(normalizeText(item.material))) score += 1;

  return { score, hasNameSignal, identitySignalCount };
}

function findItemByText(items: ClothingItem[], text: string) {
  const candidates = items
    .map((item) => ({ item, ...matchScore(item, text) }))
    .filter(
      ({ score, hasNameSignal, identitySignalCount }) =>
        score >= 4 && (hasNameSignal || identitySignalCount >= 2),
    )
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { item: null, ambiguousItems: [] };
  }

  const topScore = candidates[0].score;
  const ambiguousItems = candidates
    .filter(({ score }) => score === topScore)
    .map(({ item }) => item);

  if (ambiguousItems.length > 1) {
    return { item: null, ambiguousItems };
  }

  return { item: candidates[0].item, ambiguousItems: [] };
}

function conditionFlagsFromText(text: string) {
  const flags: ConditionFlag[] = [];
  if (text.includes("땀")) flags.push("sweat");
  if (text.includes("냄새")) flags.push("odor");
  if (text.includes("얼룩")) flags.push("stain");

  return flags;
}

function actionFromText(text: string) {
  if (text.includes("세탁") || text.includes("빨")) {
    return "wash";
  }

  if (text.includes("입") || text.includes("착용") || text.includes("신")) {
    return "wear";
  }

  return null;
}

export default function Home() {
  const [items, setItems] = useState<ClothingItem[]>(() => {
    if (typeof window === "undefined") {
      return seedItems;
    }

    return loadStoredItems();
  });
  const [filter, setFilter] = useState<"all" | "needsCare" | "fresh">("all");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newCategory, setNewCategory] = useState("상의");
  const [newMaterial, setNewMaterial] = useState("면");
  const [quickLog, setQuickLog] = useState("");
  const [quickCandidates, setQuickCandidates] = useState<ClothingItem[]>([]);
  const [pendingQuickText, setPendingQuickText] = useState("");
  const [feedback, setFeedback] = useState(
    "예: 오늘 나이키 러닝 반팔 검정 M 입었어",
  );
  const [todayLogCount, setTodayLogCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const storedCount =
      window.localStorage.getItem(countStorageKey) ??
      window.localStorage.getItem(legacyCountStorageKey);
    return storedCount ? Number(storedCount) : 0;
  });

  useEffect(() => {
    window.localStorage.setItem(itemsStorageKey, JSON.stringify(items));
    window.localStorage.setItem(countStorageKey, String(todayLogCount));
  }, [items, todayLogCount]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const currentStatus = statusFor(item).label;

      if (filter === "needsCare") {
        return currentStatus !== "깨끗함";
      }

      if (filter === "fresh") {
        return currentStatus === "깨끗함";
      }

      return true;
    });
  }, [filter, items]);

  const needsCareCount = items.filter(
    (item) => statusFor(item).label !== "깨끗함",
  ).length;

  function markWashed(id: number, source = "버튼") {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, washedAt: todayText, wearCount: 0, flags: [] }
          : item,
      ),
    );
    setTodayLogCount((count) => count + 1);
    setFeedback(`${source} 기록 완료 · 세탁 기준 초기화`);
  }

  function addWear(id: number, flags: ConditionFlag[] = [], source = "버튼") {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              wornAt: todayText,
              wearCount: item.wearCount + 1,
              flags: Array.from(new Set([...item.flags, ...flags])),
            }
          : item,
      ),
    );
    setTodayLogCount((count) => count + 1);
    setFeedback(`${source} 기록 완료 · 상태 재계산`);
  }

  function updateConditionFlags(
    id: number,
    flags: ConditionFlag[],
    source = "상태",
    mode: "add" | "toggle" = "toggle",
  ) {
    if (flags.length === 0) {
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (mode === "add") {
          return {
            ...item,
            flags: Array.from(new Set([...item.flags, ...flags])),
          };
        }

        const shouldRemove = flags.every((flag) => item.flags.includes(flag));
        return {
          ...item,
          flags: shouldRemove
            ? item.flags.filter((flag) => !flags.includes(flag))
            : Array.from(new Set([...item.flags, ...flags])),
        };
      }),
    );
    setFeedback(`${source} 표시 업데이트 · 착용 횟수 유지`);
  }

  function completeQuickLog(item: ClothingItem, text: string, source = "문장") {
    const flags = conditionFlagsFromText(text);
    const action = actionFromText(text);

    setQuickCandidates([]);
    setPendingQuickText("");

    if (action === "wash") {
      markWashed(item.id, source);
      setQuickLog("");
      return;
    }

    if (action === "wear") {
      addWear(item.id, flags, source);
      setQuickLog("");
      return;
    }

    if (flags.length > 0) {
      updateConditionFlags(item.id, flags, source, "add");
      setQuickLog("");
      return;
    }

    setFeedback("입었어 또는 세탁했어로 기록 가능");
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      return;
    }

    const nextItem = {
      id: Date.now(),
      name,
      brand: cleanText(newBrand),
      color: cleanText(newColor),
      feature: cleanText(newFeature),
      size: cleanText(newSize),
      category: newCategory,
      material: newMaterial,
      careProfile: profileFor(newCategory, newMaterial),
      washedAt: todayText,
      wearCount: 0,
      flags: [],
    } satisfies ClothingItem;

    if (identityParts(nextItem).length === 0) {
      setFeedback("브랜드·색상·특징·사이즈 중 하나 이상 입력 필요");
      return;
    }

    const nextIdentityKey = identityKeyFor(nextItem);
    const hasDuplicate = items.some(
      (item) => identityKeyFor(item) === nextIdentityKey,
    );

    if (hasDuplicate) {
      setFeedback("같은 구분 정보의 옷이 이미 등록됨");
      return;
    }

    setItems((current) => [nextItem, ...current]);
    setNewName("");
    setNewBrand("");
    setNewColor("");
    setNewFeature("");
    setNewSize("");
    setFeedback(`${itemDisplayName(nextItem)} 등록 완료`);
  }

  function submitQuickLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = quickLog.trim();
    const { item, ambiguousItems } = findItemByText(items, text);
    if (!text || !item) {
      if (ambiguousItems.length > 1) {
        setQuickCandidates(ambiguousItems);
        setPendingQuickText(text);
        setFeedback(
          "동명이 여러 벌입니다. 아래에서 기록할 옷을 선택해주세요",
        );
        return;
      }

      setQuickCandidates([]);
      setPendingQuickText("");
      setFeedback("등록된 옷 이름을 포함해 다시 입력");
      return;
    }

    completeQuickLog(item, text);
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-[#17211c]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5">
        <header className="flex items-center justify-between pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">WashLog</p>
            <h1 className="mt-1 text-[28px] font-semibold leading-9">
              소재별 세탁 타이밍
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
            <p className="mt-3 text-2xl font-semibold">{needsCareCount}</p>
            <p className="text-xs font-medium text-zinc-500">관리 필요</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-3">
            <CalendarDays aria-hidden="true" className="text-rose-600" size={18} />
            <p className="mt-3 text-2xl font-semibold">{todayLogCount}</p>
            <p className="text-xs font-medium text-zinc-500">오늘 기록</p>
          </div>
        </section>

        <form
          onSubmit={submitQuickLog}
          className="mt-5 rounded-2xl border border-zinc-200 bg-white p-3"
        >
          <label className="text-sm font-semibold" htmlFor="quick-log">
            빠른 기록
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_44px] gap-2">
            <input
              id="quick-log"
              className="h-11 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="오늘 나이키 러닝 반팔 검정 M 입었어"
              value={quickLog}
              onChange={(event) => {
                setQuickLog(event.target.value);
                setQuickCandidates([]);
                setPendingQuickText("");
              }}
            />
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#17211c] text-white transition hover:bg-emerald-800"
              aria-label="빠른 기록 추가"
            >
              <MessageCircle aria-hidden="true" size={19} />
            </button>
          </div>
          <p className="mt-2 text-xs font-medium text-zinc-500">{feedback}</p>
          {quickCandidates.length > 0 ? (
            <div className="mt-2 grid gap-2">
              {quickCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() =>
                    completeQuickLog(
                      candidate,
                      pendingQuickText || quickLog,
                      "선택",
                    )
                  }
                  className="min-h-10 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  {itemDisplayName(candidate)}
                </button>
              ))}
            </div>
          ) : null}
        </form>

        <form
          onSubmit={addItem}
          className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3"
        >
          <label className="text-sm font-semibold" htmlFor="new-clothing-name">
            옷 추가
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_44px] gap-2">
            <input
              id="new-clothing-name"
              className="h-11 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="예: 러닝 반팔"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
              aria-label="옷 추가"
            >
              <Plus aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              className="h-10 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="브랜드"
              value={newBrand}
              onChange={(event) => setNewBrand(event.target.value)}
              aria-label="브랜드"
            />
            <input
              className="h-10 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="색상"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              aria-label="색상"
            />
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_96px] gap-2">
            <input
              className="h-10 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="특징"
              value={newFeature}
              onChange={(event) => setNewFeature(event.target.value)}
              aria-label="특징"
            />
            <input
              className="h-10 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-emerald-500"
              placeholder="사이즈"
              value={newSize}
              onChange={(event) => setNewSize(event.target.value)}
              aria-label="사이즈"
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select
              className="h-10 min-w-0 rounded-xl border border-zinc-200 bg-white px-2 text-sm outline-none transition focus:border-emerald-500"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              aria-label="옷 종류"
            >
              <option>상의</option>
              <option>하의</option>
              <option>운동복</option>
              <option>니트</option>
              <option>아우터</option>
            </select>
            <select
              className="h-10 min-w-0 rounded-xl border border-zinc-200 bg-white px-2 text-sm outline-none transition focus:border-emerald-500"
              value={newMaterial}
              onChange={(event) => setNewMaterial(event.target.value)}
              aria-label="소재"
            >
              <option>면</option>
              <option>폴리에스터</option>
              <option>울</option>
              <option>데님</option>
              <option>실크</option>
              <option>혼방</option>
            </select>
          </div>
        </form>

        <nav className="mt-5 grid grid-cols-3 rounded-2xl bg-zinc-200 p-1">
          {[
            ["all", "전체"],
            ["needsCare", "관리 필요"],
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
            const currentStatus = statusFor(item);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                      <Shirt aria-hidden="true" size={21} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-semibold leading-6">
                        {itemTitle(item)}
                      </h2>
                      <p className="mt-1 break-words text-sm font-medium text-zinc-600">
                        {itemDetailParts(item).join(" · ") ||
                          "구분 정보 미입력"}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-zinc-500">
                        {item.category} · {item.material} · {wearSummary(item)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${currentStatus.tone}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2">
                  <p className="text-sm font-semibold text-zinc-800">
                    {currentStatus.reason}
                  </p>
                  <div className="mt-1 grid gap-0.5 text-xs font-medium text-zinc-500">
                    <p>마지막 착용 {calendarDateSummary(item.wornAt)}</p>
                    <p>마지막 세탁 {calendarDateSummary(item.washedAt)}</p>
                    {item.maintainedAt ? (
                      <p>마지막 관리 {calendarDateSummary(item.maintainedAt)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(Object.keys(conditionMeta) as ConditionFlag[]).map((flag) => {
                    const Icon = conditionMeta[flag].icon;
                    const active = item.flags.includes(flag);

                    return (
                      <button
                        key={flag}
                        type="button"
                        onClick={() =>
                          updateConditionFlags(item.id, [flag], conditionMeta[flag].label)
                        }
                        className={`flex h-9 items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition ${
                          active
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <Icon aria-hidden="true" size={14} />
                        {conditionMeta[flag].label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
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

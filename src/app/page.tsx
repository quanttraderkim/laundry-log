"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Droplets,
  Dumbbell,
  Layers,
  MessageCircle,
  Plus,
  Shirt,
  Sparkles,
  StretchHorizontal,
  Tags,
  TriangleAlert,
  Umbrella,
  WashingMachine,
  Wind,
} from "lucide-react";
import Image from "next/image";
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

type SortMode =
  | "careFirst"
  | "recentWear"
  | "brand"
  | "category"
  | "wearCount";

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

const quickLogSuggestions = [
  "나이키 러닝 반팔 M 입었어",
  "데님 팬츠 입고 땀 났어",
  "유니클로 셔츠 세탁했어",
];

const brandLogoMap: Record<string, { label: string; slug: string }> = {
  nike: { label: "Nike", slug: "nike" },
  나이키: { label: "Nike", slug: "nike" },
  uniqlo: { label: "UNIQLO", slug: "uniqlo" },
  유니클로: { label: "UNIQLO", slug: "uniqlo" },
  adidas: { label: "Adidas", slug: "adidas" },
  아디다스: { label: "Adidas", slug: "adidas" },
  zara: { label: "ZARA", slug: "zara" },
  자라: { label: "ZARA", slug: "zara" },
  thenorthface: { label: "The North Face", slug: "thenorthface" },
  노스페이스: { label: "The North Face", slug: "thenorthface" },
  더노스페이스: { label: "The North Face", slug: "thenorthface" },
  newbalance: { label: "New Balance", slug: "newbalance" },
  뉴발란스: { label: "New Balance", slug: "newbalance" },
  뉴발: { label: "New Balance", slug: "newbalance" },
  puma: { label: "Puma", slug: "puma" },
  푸마: { label: "Puma", slug: "puma" },
  underarmour: { label: "Under Armour", slug: "underarmour" },
  언더아머: { label: "Under Armour", slug: "underarmour" },
  hm: { label: "H&M", slug: "handm" },
  handm: { label: "H&M", slug: "handm" },
  "h&m": { label: "H&M", slug: "handm" },
  에이치앤엠: { label: "H&M", slug: "handm" },
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

function designToneFor(status: Status) {
  if (status.label === "세탁 권장") {
    return {
      chip: "bg-[#F1DDD2] text-[#B55842]",
      dot: "bg-[#B55842]",
      metric: "text-[#B55842]",
      surface: "bg-[#F1DDD2]",
      border: "border-[#EAD0C4]",
    };
  }

  if (status.label === "곧 세탁") {
    return {
      chip: "bg-[#F2E6CC] text-[#B8853A]",
      dot: "bg-[#B8853A]",
      metric: "text-[#B8853A]",
      surface: "bg-[#F2E6CC]",
      border: "border-[#E7D6B8]",
    };
  }

  if (status.label === "통풍 권장") {
    return {
      chip: "bg-[#DAE4EA] text-[#5E7E92]",
      dot: "bg-[#5E7E92]",
      metric: "text-[#5E7E92]",
      surface: "bg-[#DAE4EA]",
      border: "border-[#CBD9E0]",
    };
  }

  return {
    chip: "bg-[#E4ECE3] text-[#46685C]",
    dot: "bg-[#46685C]",
    metric: "text-[#46685C]",
    surface: "bg-[#E4ECE3]",
    border: "border-[#D2DFD2]",
  };
}

function profileFor(category: string, material: string): CareProfile {
  if (category === "운동복") {
    return "active_synthetic";
  }

  if (category === "아우터" || category === "코트") {
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

function compareText(first: string, second: string) {
  return first.localeCompare(second, "ko-KR", { numeric: true });
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

function brandMarkFor(item: ClothingItem) {
  const brand = cleanText(item.brand).replace(/\s/g, "");
  const fallback = cleanText(item.name).replace(/\s/g, "");
  const mark = brand || fallback;

  return mark.length > 8 ? mark.slice(0, 8) : mark;
}

function brandLogoFor(item: ClothingItem) {
  const key = normalizeText(item.brand).replace(/&/g, "and");
  const logo = brandLogoMap[key];

  return logo
    ? {
        ...logo,
        src: `https://cdn.simpleicons.org/${logo.slug}`,
      }
    : null;
}

function BrandTitleMark({ item }: { item: ClothingItem }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logo = brandLogoFor(item);
  const fallbackMark = brandMarkFor(item).slice(0, 2);

  if (logo && !logoFailed) {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D7E0D8] p-1.5"
        title={`${logo.label} 로고`}
      >
        <Image
          src={logo.src}
          alt=""
          width={20}
          height={20}
          className="h-full w-full object-contain"
          loading="lazy"
          unoptimized
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D7E0D8] text-[9px] font-extrabold leading-none text-[#46685C]"
      aria-label={`${fallbackMark} 브랜드 마크`}
      title={`${fallbackMark} 브랜드 마크`}
    >
      {fallbackMark}
    </span>
  );
}

function categoryVisualFor(item: ClothingItem) {
  if (item.category === "운동복" || item.careProfile === "active_synthetic") {
    return {
      icon: Dumbbell,
      label: "운동복",
      surface: "border-emerald-100 bg-emerald-50 text-emerald-800",
      iconBox: "bg-white text-emerald-700",
    };
  }

  if (
    item.category === "아우터" ||
    item.category === "코트" ||
    item.careProfile === "seasonal_outer"
  ) {
    return {
      icon: Umbrella,
      label: item.category === "코트" ? "코트" : "아우터",
      surface: "border-zinc-200 bg-zinc-100 text-zinc-800",
      iconBox: "bg-white text-zinc-700",
    };
  }

  if (item.category === "하의" || item.careProfile === "denim") {
    return {
      icon: StretchHorizontal,
      label: "하의",
      surface: "border-amber-100 bg-amber-50 text-amber-800",
      iconBox: "bg-white text-amber-700",
    };
  }

  if (item.category === "니트" || item.careProfile === "wool_delicate") {
    return {
      icon: Layers,
      label: "니트",
      surface: "border-sky-100 bg-sky-50 text-sky-800",
      iconBox: "bg-white text-sky-700",
    };
  }

  if (
    item.category === "상의" ||
    item.category === "셔츠" ||
    item.careProfile === "cotton_top"
  ) {
    return {
      icon: Shirt,
      label: item.category === "셔츠" ? "셔츠" : "상의",
      surface: "border-emerald-100 bg-white text-zinc-800",
      iconBox: "bg-emerald-50 text-emerald-700",
    };
  }

  return {
    icon: Tags,
    label: item.category,
    surface: "border-zinc-200 bg-white text-zinc-800",
    iconBox: "bg-zinc-100 text-zinc-700",
  };
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

function loadStoredLogCount() {
  const storedCount =
    window.localStorage.getItem(countStorageKey) ??
    window.localStorage.getItem(legacyCountStorageKey);

  return storedCount ? Number(storedCount) : 0;
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

function optionValues(items: ClothingItem[], field: "brand" | "category") {
  return Array.from(
    new Set(items.map((item) => cleanText(item[field])).filter(Boolean)),
  ).sort(compareText);
}

function statusPriority(item: ClothingItem) {
  const priority: Record<Status["label"], number> = {
    "세탁 권장": 0,
    "곧 세탁": 1,
    "통풍 권장": 2,
    깨끗함: 3,
  };

  return priority[statusFor(item).label];
}

function sortedItems(items: ClothingItem[], sortMode: SortMode) {
  return [...items].sort((first, second) => {
    if (sortMode === "recentWear") {
      return (
        compareText(second.wornAt ?? "", first.wornAt ?? "") ||
        compareText(itemTitle(first), itemTitle(second))
      );
    }

    if (sortMode === "brand") {
      return (
        compareText(first.brand, second.brand) ||
        compareText(first.name, second.name) ||
        compareText(first.size, second.size)
      );
    }

    if (sortMode === "category") {
      return (
        compareText(first.category, second.category) ||
        compareText(first.brand, second.brand) ||
        compareText(first.name, second.name)
      );
    }

    if (sortMode === "wearCount") {
      return (
        second.wearCount - first.wearCount ||
        compareText(itemTitle(first), itemTitle(second))
      );
    }

    return (
      statusPriority(first) - statusPriority(second) ||
      compareText(first.washedAt, second.washedAt) ||
      compareText(itemTitle(first), itemTitle(second))
    );
  });
}

export default function Home() {
  const [items, setItems] = useState<ClothingItem[]>(seedItems);
  const [filter, setFilter] = useState<"all" | "needsCare" | "fresh">("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("careFirst");
  const [storageReady, setStorageReady] = useState(false);
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
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(
    "예: 오늘 나이키 러닝 반팔 검정 M 입었어",
  );
  const [todayLogCount, setTodayLogCount] = useState(0);

  useEffect(() => {
    let active = true;
    const storedItems = loadStoredItems();
    const storedLogCount = loadStoredLogCount();

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setItems(storedItems);
      setTodayLogCount(storedLogCount);
      setStorageReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(itemsStorageKey, JSON.stringify(items));
    window.localStorage.setItem(countStorageKey, String(todayLogCount));
  }, [items, storageReady, todayLogCount]);

  const brandOptions = useMemo(() => optionValues(items, "brand"), [items]);
  const categoryOptions = useMemo(() => optionValues(items, "category"), [items]);

  const filteredItems = useMemo(() => {
    const matchedItems = items.filter((item) => {
      if (brandFilter !== "all" && cleanText(item.brand) !== brandFilter) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        cleanText(item.category) !== categoryFilter
      ) {
        return false;
      }

      const currentStatus = statusFor(item).label;
      if (filter === "needsCare") {
        return currentStatus !== "깨끗함";
      }

      if (filter === "fresh") {
        return currentStatus === "깨끗함";
      }

      return true;
    });

    return sortedItems(matchedItems, sortMode);
  }, [brandFilter, categoryFilter, filter, items, sortMode]);

  const needsCareCount = items.filter(
    (item) => statusFor(item).label !== "깨끗함",
  ).length;
  const freshCount = items.length - needsCareCount;

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
    setAdding(false);
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
    <main className="min-h-screen bg-[#EEEAE0] text-[#1B201D] [background:radial-gradient(80%_45%_at_85%_0%,#F8F5ED_0%,transparent_65%),radial-gradient(80%_50%_at_0%_100%,#E2DCCD_0%,transparent_62%),#EEEAE0]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-7">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D7E0D8] px-3 py-1.5 text-[12px] font-semibold text-[#46685C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#46685C]" />
            2026 · 5월 19일 화
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#1B201D] text-white shadow-[0_14px_30px_-14px_rgba(27,32,29,0.55)]">
              <WashingMachine aria-hidden="true" size={28} strokeWidth={1.8} />
              <div className="pointer-events-none absolute inset-x-1 top-1 h-6 rounded-t-2xl bg-white/10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[34px] font-extrabold leading-none text-[#1B201D]">
                Wash<span className="text-[#46685C]">Log</span>
              </h1>
              <p className="mt-1 text-[11px] font-semibold uppercase text-[#5C615D]">
                Care · Wear · Wash
              </p>
            </div>
          </div>

          <p className="mt-4 text-[14px] font-medium leading-6 text-[#5C615D]">
            <span className="font-bold text-[#B55842]">{needsCareCount}벌</span>이
            관리 필요 ·{" "}
            <span className="font-bold text-[#46685C]">{freshCount}벌</span>은
            바로 착용 가능
          </p>
        </header>

        <section
          className="mt-6 grid grid-cols-3 overflow-hidden rounded-[22px] border border-[#E4DFD2] bg-white"
          aria-label="오늘 상태 요약"
        >
          {[
            { label: "등록한 옷", value: items.length, icon: Sparkles, tone: "text-[#1B201D]" },
            { label: "관리 필요", value: needsCareCount, icon: Clock3, tone: "text-[#B55842]" },
            { label: "오늘 기록", value: todayLogCount, icon: CalendarDays, tone: "text-[#46685C]" },
          ].map((stat, index) => {
            const StatIcon = stat.icon;

            return (
              <div
                key={stat.label}
                className={`px-4 py-4 ${
                  index === 0 ? "" : "border-l border-[#E4DFD2]"
                }`}
              >
                <StatIcon aria-hidden="true" className={stat.tone} size={17} />
                <p
                  className={`mt-3 flex items-baseline gap-1 text-[30px] font-bold leading-none ${stat.tone}`}
                >
                  {stat.value}
                  <span className="text-[12px] font-medium text-[#9A9A92]">벌</span>
                </p>
                <p className="mt-1 text-[12px] font-medium text-[#5C615D]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </section>

        <form
          onSubmit={submitQuickLog}
          className="mt-3 rounded-[22px] border border-[#E4DFD2] bg-white p-3"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <label
              className="shrink-0 text-[13px] font-semibold text-[#5C615D]"
              htmlFor="quick-log"
            >
              한 문장으로 기록
            </label>
            <p className="min-w-0 truncate text-right text-[11px] font-medium text-[#9A9A92]">
              {feedback}
            </p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
            <input
              id="quick-log"
              className="h-11 min-w-0 rounded-[14px] border border-[#E4DFD2] bg-[#FAF6EE] px-3 text-[14px] font-medium text-[#1B201D] outline-none transition placeholder:text-[#9A9A92] focus:border-[#46685C]"
              placeholder="오늘 나이키 러닝 반팔 M 입었어"
              value={quickLog}
              onChange={(event) => {
                setQuickLog(event.target.value);
                setQuickCandidates([]);
                setPendingQuickText("");
              }}
            />
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1B201D] text-white transition active:scale-95"
              aria-label="빠른 기록 추가"
            >
              <MessageCircle aria-hidden="true" size={19} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickLogSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuickLog(suggestion);
                  setQuickCandidates([]);
                  setPendingQuickText("");
                }}
                className="rounded-full border border-[#E4DFD2] px-3 py-1.5 text-[12px] font-medium text-[#5C615D] transition hover:border-[#46685C] hover:text-[#46685C] active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {quickCandidates.length > 0 ? (
            <div className="mt-3 grid gap-2">
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
                  className="min-h-10 rounded-[14px] border border-[#D7E0D8] bg-[#E4ECE3] px-3 py-2 text-left text-sm font-semibold text-[#46685C] transition hover:bg-[#D7E0D8]"
                >
                  {itemDisplayName(candidate)}
                </button>
              ))}
            </div>
          ) : null}
        </form>

        {adding ? (
          <form
            onSubmit={addItem}
            className="mt-3 rounded-[18px] border border-dashed border-[#9DB2A5] bg-[#FAF6EE] p-3"
          >
            <label
              className="text-[13px] font-semibold text-[#5C615D]"
              htmlFor="new-clothing-name"
            >
              옷 추가
            </label>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_44px] gap-2">
              <input
                id="new-clothing-name"
                className="h-11 min-w-0 rounded-[14px] border border-[#E4DFD2] bg-white px-3 text-sm font-medium outline-none transition focus:border-[#46685C]"
                placeholder="예: 러닝 반팔"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#46685C] text-white transition active:scale-95"
                aria-label="옷 추가"
              >
                <Plus aria-hidden="true" size={20} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-3 text-sm outline-none transition focus:border-[#46685C]"
                placeholder="브랜드"
                value={newBrand}
                onChange={(event) => setNewBrand(event.target.value)}
                aria-label="브랜드"
              />
              <input
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-3 text-sm outline-none transition focus:border-[#46685C]"
                placeholder="색상"
                value={newColor}
                onChange={(event) => setNewColor(event.target.value)}
                aria-label="색상"
              />
            </div>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_96px] gap-2">
              <input
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-3 text-sm outline-none transition focus:border-[#46685C]"
                placeholder="특징"
                value={newFeature}
                onChange={(event) => setNewFeature(event.target.value)}
                aria-label="특징"
              />
              <input
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-3 text-sm outline-none transition focus:border-[#46685C]"
                placeholder="사이즈"
                value={newSize}
                onChange={(event) => setNewSize(event.target.value)}
                aria-label="사이즈"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-2 text-sm font-medium outline-none transition focus:border-[#46685C]"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                aria-label="옷 종류"
              >
                <option>상의</option>
                <option>셔츠</option>
                <option>하의</option>
                <option>운동복</option>
                <option>니트</option>
                <option>아우터</option>
                <option>코트</option>
              </select>
              <select
                className="h-10 min-w-0 rounded-[12px] border border-[#E4DFD2] bg-white px-2 text-sm font-medium outline-none transition focus:border-[#46685C]"
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
        ) : null}

        <nav className="mt-5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 gap-1 overflow-x-auto">
            {[
              ["all", `전체 ${items.length}`],
              ["needsCare", `관리 필요 ${needsCareCount}`],
              ["fresh", `깨끗함 ${freshCount}`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as typeof filter)}
                className={`h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold transition active:scale-95 ${
                  filter === key
                    ? "bg-[#1B201D] text-white"
                    : "text-[#5C615D] hover:bg-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E4DFD2] bg-white px-3 text-[13px] font-semibold text-[#1B201D] shadow-sm transition active:scale-95"
          >
            <Plus aria-hidden="true" size={15} />
            옷 추가
          </button>
        </nav>

        <section
          className="mt-3 rounded-[18px] border border-[#E4DFD2] bg-white p-3"
          aria-label="옷 목록 필터"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="min-w-0 text-[11px] font-bold uppercase text-[#9A9A92]">
              브랜드
              <select
                className="mt-1 h-10 w-full min-w-0 rounded-[12px] border border-[#E4DFD2] bg-[#FAF6EE] px-2 text-[13px] font-semibold text-[#1B201D] outline-none transition focus:border-[#46685C]"
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
                aria-label="브랜드 필터"
              >
                <option value="all">전체 브랜드</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-[11px] font-bold uppercase text-[#9A9A92]">
              종류
              <select
                className="mt-1 h-10 w-full min-w-0 rounded-[12px] border border-[#E4DFD2] bg-[#FAF6EE] px-2 text-[13px] font-semibold text-[#1B201D] outline-none transition focus:border-[#46685C]"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="종류 필터"
              >
                <option value="all">전체 종류</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 min-w-0 text-[11px] font-bold uppercase text-[#9A9A92]">
              정렬
              <select
                className="mt-1 h-10 w-full min-w-0 rounded-[12px] border border-[#E4DFD2] bg-[#FAF6EE] px-2 text-[13px] font-semibold text-[#1B201D] outline-none transition focus:border-[#46685C]"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                aria-label="정렬"
              >
                <option value="careFirst">관리 필요 우선</option>
                <option value="recentWear">최근 착용순</option>
                <option value="brand">브랜드순</option>
                <option value="category">종류순</option>
                <option value="wearCount">착용 많은 순</option>
              </select>
            </label>
          </div>
          <p className="mt-2 px-1 text-[12px] font-medium text-[#5C615D]">
            {items.length}벌 중 {filteredItems.length}벌 표시
          </p>
        </section>

        <section className="mt-4 flex flex-1 flex-col gap-3">
          {filteredItems.map((item) => {
            const currentStatus = statusFor(item);
            const visual = categoryVisualFor(item);
            const tone = designToneFor(currentStatus);
            const CategoryIcon = visual.icon;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[22px] border border-[#E4DFD2] bg-white"
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border ${tone.surface} ${tone.border}`}
                    aria-label={visual.label}
                  >
                    <CategoryIcon
                      aria-hidden="true"
                      className={tone.metric}
                      size={27}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <BrandTitleMark item={item} />
                      <h2 className="min-w-0 truncate text-[16px] font-bold leading-6 text-[#1B201D]">
                        {itemTitle(item)}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-[12px] font-medium text-[#5C615D]">
                      {itemDetailParts(item).join(" · ") || "구분 정보 미입력"}
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#9A9A92]">
                      {item.category} · {item.material} · {wearSummary(item)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    {currentStatus.label}
                  </span>
                </div>

                <div className="mx-4 mt-3 grid grid-cols-3 rounded-[16px] bg-[#FAF6EE] px-3 py-3">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-semibold uppercase text-[#9A9A92]">
                      마지막 착용
                    </p>
                    <p className="mt-1 text-[13px] font-bold text-[#1B201D]">
                      {calendarDate(item.wornAt)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#9A9A92]">
                      {relativeDate(item.wornAt) ?? "기록 없음"}
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-[#E4DFD2] px-2">
                    <p className="text-[10px] font-semibold uppercase text-[#9A9A92]">
                      마지막 세탁
                    </p>
                    <p className="mt-1 text-[13px] font-bold text-[#1B201D]">
                      {calendarDate(item.washedAt)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#9A9A92]">
                      {relativeDate(item.washedAt)}
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-[#E4DFD2] pl-2">
                    <p className="text-[10px] font-semibold uppercase text-[#9A9A92]">
                      상태
                    </p>
                    <p className={`mt-1 text-[13px] font-bold ${tone.metric}`}>
                      {currentStatus.label}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium leading-4 text-[#5C615D]">
                      {currentStatus.reason}
                    </p>
                  </div>
                </div>

                {item.maintainedAt ? (
                  <p className="mx-4 mt-2 rounded-[12px] bg-[#DAE4EA] px-3 py-2 text-[12px] font-medium text-[#5E7E92]">
                    마지막 관리 {calendarDateSummary(item.maintainedAt)}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                  {(Object.keys(conditionMeta) as ConditionFlag[]).map((flag) => {
                    const Icon = conditionMeta[flag].icon;
                    const active = item.flags.includes(flag);

                    return (
                      <button
                        key={flag}
                        type="button"
                        onClick={() =>
                          updateConditionFlags(
                            item.id,
                            [flag],
                            conditionMeta[flag].label,
                          )
                        }
                        className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition active:scale-95 ${
                          active
                            ? "border-[#B55842] bg-[#F1DDD2] text-[#B55842]"
                            : "border-[#E4DFD2] text-[#5C615D] hover:bg-[#FAF6EE]"
                        }`}
                      >
                        <Icon aria-hidden="true" size={13} />
                        {conditionMeta[flag].label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => addWear(item.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#E4DFD2] text-[14px] font-bold text-[#1B201D] transition hover:bg-[#FAF6EE] active:scale-95"
                  >
                    <Clock3 aria-hidden="true" size={16} />
                    오늘 입었어요
                  </button>
                  <button
                    type="button"
                    onClick={() => markWashed(item.id)}
                    className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#1B201D] text-[14px] font-bold text-white transition active:scale-95"
                  >
                    <CheckCircle2 aria-hidden="true" size={16} />
                    세탁 완료
                  </button>
                </div>
              </article>
            );
          })}
          {filteredItems.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#D7D0C2] px-5 py-8 text-center text-[#5C615D]">
              <p className="font-bold">해당하는 옷이 없습니다</p>
              <p className="mt-1 text-[13px] font-medium">
                필터를 바꾸거나 새 옷을 추가해보세요.
              </p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

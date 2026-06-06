"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Lunar } from "lunar-javascript";

function getLunarStr(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return "";
    const lunar = Lunar.fromDate(date);
    return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return "";
  }
}

interface EntryFiltersProps {
  weathers: string[];
  locations: string[];
}

export default function EntryFilters({ weathers, locations }: EntryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [weather, setWeather] = useState(searchParams.get("weather") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const hasFilters = startDate || endDate || weather || location;

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set("startDate", startDate); else params.delete("startDate");
    if (endDate) params.set("endDate", endDate); else params.delete("endDate");
    if (weather) params.set("weather", weather); else params.delete("weather");
    if (location) params.set("location", location); else params.delete("location");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setWeather("");
    setLocation("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");
    params.delete("weather");
    params.delete("location");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        筛选
        {hasFilters && (
          <span className="px-1.5 py-0.5 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-full text-xs">
            {(startDate ? 1 : 0) + (endDate ? 1 : 0) + (weather ? 1 : 0) + (location ? 1 : 0)}
          </span>
        )}
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
        <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 space-y-4 animate-fade-in-down">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500 dark:text-stone-400">日期:</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 focus:outline-none bg-white dark:bg-stone-800 input-focus"
                />
                {startDate && (
                  <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">{getLunarStr(startDate)}</span>
                )}
              </div>
              <span className="text-stone-400 dark:text-stone-500">~</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 focus:outline-none bg-white dark:bg-stone-800 input-focus"
                />
                {endDate && (
                  <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">{getLunarStr(endDate)}</span>
                )}
              </div>
            </div>

            {weathers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500 dark:text-stone-400">天气:</span>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="px-2 py-1 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 focus:outline-none bg-white dark:bg-stone-800 input-focus"
                >
                  <option value="">全部</option>
                  {weathers.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            )}

            {locations.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500 dark:text-stone-400">地点:</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-2 py-1 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-200 focus:outline-none bg-white dark:bg-stone-800 input-focus"
                >
                  <option value="">全部</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="btn-primary px-3 py-1"
            >
              应用筛选
            </button>
            {hasFilters && (
              <button
                onClick={handleClear}
                className="px-3 py-1 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

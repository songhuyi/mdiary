"use client";

import { useState, useEffect, useRef } from "react";

function getSolarInfo(now: Date) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return {
    date: `${y}年${m}月${d}日`,
    time: `${h}:${min}:${s}`,
    dayOfWeek: days[now.getDay()],
  };
}

function getLunarStr(now: Date): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Lunar } = require("lunar-javascript");
    const lunar = Lunar.fromDate(now);
    return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return "";
  }
}

interface WeatherData {
  weather: string;
  temperature: string;
  weatherIcon: string;
}

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (fetchedRef.current || !navigator.geolocation) return;
    fetchedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
          .then((r) => r.json())
          .then(setWeather)
          .catch(() => {});
      },
      () => {}
    );
  }, []);

  const solar = getSolarInfo(now);
  const lunar = getLunarStr(now);

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl font-serif text-stone-800 dark:text-stone-100 tracking-tight">{solar.time}</span>
        {weather && (
          <span className="text-lg text-stone-700 dark:text-stone-200 animate-float">
            {weather.weatherIcon} {weather.temperature}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400 flex-wrap">
        <span>{solar.date}</span>
        <span>{solar.dayOfWeek}</span>
        {lunar && <span>农历{lunar}</span>}
        {weather && <span>{weather.weather}</span>}
      </div>
    </div>
  );
}

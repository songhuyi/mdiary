"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import RichEditor from "@/components/RichEditor";
import AIPolishButton from "@/components/AIPolishButton";
import ModelSelector from "@/components/ModelSelector";

interface WeatherData {
  weather: string;
  temperature: string;
  weatherIcon: string;
  city: string;
}

function getInitialState() {
  if (typeof window === "undefined") return { title: "", content: "" };
  const query = new URLSearchParams(window.location.search);
  return {
    title: query.get("title") || "",
    content: query.get("content") || "",
  };
}

function getDisplayInfo() {
  const now = new Date();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const dayOfWeek = days[now.getDay()];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const solarDate = `${year}-${month}-${day}`;
  return { dayOfWeek, timeStr: `${hours}:${minutes}`, solarDate };
}

export default function NewEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const initialState = typeof window !== "undefined" ? getInitialState() : { title: "", content: "" };
  const [title, setTitle] = useState(initialState.title);
  const [content, setContent] = useState(initialState.content);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [model, setModel] = useState("deepseek-v4-pro");
  const [lunarDate, setLunarDate] = useState("");
  const { dayOfWeek, timeStr, solarDate } = getDisplayInfo();

  useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  useEffect(() => {
    fetch("/api/lunar")
      .then((res) => res.json())
      .then((data) => { if (data.lunarDate) setLunarDate(data.lunarDate); })
      .catch(() => {});
  }, []);

  const fetchWeather = () => {
    if (!navigator.geolocation) return;
    setFetchingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            setWeather(data);
          }
        } catch {
          console.error("获取天气失败");
        }
        setFetchingWeather(false);
      },
      () => {
        setFetchingWeather(false);
      }
    );
  };

  const handleGenerateTitle = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      alert("请先写一些内容");
      return;
    }
    setGeneratingTitle(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "title", content: plainText, model }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else if (data.title) {
        setTitle(data.title);
      }
    } catch {
      alert("网络错误，请检查网络连接后重试");
    }
    setGeneratingTitle(false);
  };

  const handleAIPolish = (aiTitle: string, aiContent: string) => {
    setTitle(aiTitle);
    setContent(`<p>${aiContent.split("\n").join("</p><p>")}</p>`);
  };

  const handleSave = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      alert("内容不能为空");
      return;
    }

    setLoading(true);

    let weatherData = weather;
    if (!weatherData) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const res = await fetch(
          `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        );
        if (res.ok) weatherData = await res.json();
      } catch {
        // ignore
      }
    }

    let lunarStr = lunarDate;
    try {
      const lunarRes = await fetch("/api/lunar");
      const lunarData = await lunarRes.json();
      if (lunarData.lunarDate) lunarStr = lunarData.lunarDate;
    } catch {}

    const now = new Date();
    const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

    await fetch(`/api/projects/${projectId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "无标题",
        content,
        weather: weatherData?.weather,
        temperature: weatherData?.temperature,
        weatherIcon: weatherData?.weatherIcon,
        lunarDate: lunarStr,
        dayOfWeek: days[now.getDay()],
        location: weatherData?.city,
      }),
    }).then(async (res) => {
      const entry = await res.json();
      if (entry?.id) {
        fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tags", title: title || "无标题", content: plainText }),
        })
          .then((r) => r.json())
          .then(async (data) => {
            if (data?.tagNames?.length) {
              const tagPromises = data.tagNames.map((name: string) =>
                fetch("/api/tags", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                }).then((r) => r.json())
              );
              const createdTags = await Promise.all(tagPromises);
              await fetch(`/api/entries/${entry.id}/tags`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tagIds: createdTags.map((t) => t.id) }),
              });
            }
          })
          .catch((e) => console.error("标签生成失败:", e));
      }
    });

    router.push(`/projects/${projectId}`);
    router.refresh();
  };

  if (!projectId) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-12 animate-fade-in">
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mb-2 inline-block transition-colors"
          >
            ← 返回项目
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题"
                className="flex-1 text-xl font-serif text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none bg-transparent"
              />
              <ModelSelector value={model} onChange={setModel} />
              {!title.trim() && content.replace(/<[^>]+>/g, "").trim() && (
                <button
                  onClick={handleGenerateTitle}
                  disabled={generatingTitle}
                  className="shrink-0 px-3 py-1 text-xs text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {generatingTitle ? "生成中..." : "AI 取标题"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 dark:text-stone-500">
              <span>{solarDate}</span>
              <span>{timeStr}</span>
              <span>{dayOfWeek}</span>
              {lunarDate && <span>农历{lunarDate}</span>}
              {weather ? (
                <>
                  <span>{weather.weatherIcon} {weather.weather}</span>
                  <span>{weather.temperature}</span>
                </>
              ) : (
                <button
                  onClick={fetchWeather}
                  disabled={fetchingWeather}
                  className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 underline disabled:opacity-50 transition-colors"
                >
                  {fetchingWeather ? "获取天气中..." : "获取当前天气"}
                </button>
              )}
            </div>
          </div>

          <RichEditor value={content} onChange={setContent} />

          <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-between">
            <AIPolishButton onApply={handleAIPolish} projectId={projectId} />
            <div className="flex gap-2">
              <Link
                href={`/projects/${projectId}`}
                className="px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                取消
              </Link>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

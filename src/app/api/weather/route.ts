import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "缺少经纬度参数" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "未配置天气 API Key" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`
    );
    const data = await res.json();

    if (data.cod !== 200) {
      return NextResponse.json({ error: "获取天气失败" }, { status: 500 });
    }

    return NextResponse.json({
      weather: data.weather[0].description,
      temperature: `${Math.round(data.main.temp)}°C`,
      weatherIcon: getWeatherIcon(data.weather[0].main),
      city: data.name,
    });
  } catch {
    return NextResponse.json({ error: "获取天气失败" }, { status: 500 });
  }
}

function getWeatherIcon(main: string): string {
  const icons: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Haze: "🌫️",
    Fog: "🌫️",
  };
  return icons[main] || "🌤️";
}

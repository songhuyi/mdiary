import { NextResponse } from "next/server";
import { getLunarInfo, getFormattedDateTime } from "@/lib/lunar";

export async function GET() {
  const now = new Date();
  const lunarInfo = getLunarInfo(now);
  return NextResponse.json({
    lunarDate: lunarInfo.lunarDate,
    dayOfWeek: lunarInfo.dayOfWeek,
    dateTime: getFormattedDateTime(now),
  });
}

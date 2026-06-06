import { Lunar } from "lunar-javascript";

export function getLunarInfo(date: Date = new Date()) {
  const lunar = Lunar.fromDate(date);
  return {
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    dayOfWeek: getDayOfWeek(date),
  };
}

function getDayOfWeek(date: Date): string {
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return days[date.getDay()];
}

export function getFormattedDateTime(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

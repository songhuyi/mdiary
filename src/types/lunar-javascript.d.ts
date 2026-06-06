declare module "lunar-javascript" {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
  }
}

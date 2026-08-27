export type MonthlyStatisticRow = {
  year: string;
  month: string;
  count: string;
};

export type MonthlyStatistic = {
  year: number;
  month: string;
  monthNumber: number;
  count: number;
};

export type ShopStatistic = {
  orders: MonthlyStatistic[];
  products: MonthlyStatistic[];
  users: MonthlyStatistic[];
};

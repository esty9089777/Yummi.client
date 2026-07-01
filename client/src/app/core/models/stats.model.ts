export interface IMostSoldProduct {
  productId: string;
  name: string;
  totalQuantity: number;
}

export interface IDashboardStats {
  totalOrders: number;
  monthlyRevenue: number;
  mostSoldProducts: IMostSoldProduct[];
  averageRating: number;
  totalCancellations: number;
}

export interface IDashboardStatsResponse {
  stats: IDashboardStats;
}

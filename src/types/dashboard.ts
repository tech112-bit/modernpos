export interface DashboardStats {
  todaySales: number
  totalProducts: number
  totalCustomers: number
  totalCategories: number
  lowStockProducts: number
}

export interface DashboardApiResponse {
  totals?: {
    products: number
    customers: number
    categories: number
  }
  today?: {
    revenue: number
  }
  lowStockCount?: number
}

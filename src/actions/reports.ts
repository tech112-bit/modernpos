import { apiRequest } from '@/actions/http'
import { type ReportsApiResponse } from '@/types/report'

export type SalesReportPeriod = 'today' | 'week' | 'month'

export async function getSalesReport(period: SalesReportPeriod, signal?: AbortSignal): Promise<ReportsApiResponse> {
  const query = new URLSearchParams({ period }).toString()
  return apiRequest<ReportsApiResponse>(`/api/reports/sales?${query}`, { signal })
}


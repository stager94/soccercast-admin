export interface PaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

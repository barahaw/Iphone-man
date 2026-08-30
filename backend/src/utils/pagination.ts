export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination(input: PaginationInput): Pagination {
  const page = Math.max(input.page ?? 1, 1);
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}


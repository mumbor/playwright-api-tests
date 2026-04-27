import { APIRequestContext } from '@playwright/test';

export interface GraphqlResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export class GraphqlApi {
  constructor(private request: APIRequestContext) {}

  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphqlResponse<T>> {
    const response = await this.request.post('/graphql', {
      data: { query, variables },
    });

    return response.json() as Promise<GraphqlResponse<T>>;
  }

  hasErrors<T>(response: GraphqlResponse<T>): boolean {
    return Array.isArray(response.errors) && response.errors.length > 0;
  }
}
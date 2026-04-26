import { APIRequestContext } from '@playwright/test';

export interface GithubUser {
  login: string;
  id: number;
  name: string;
  public_repos: number;
  followers: number;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  stargazers_count: number;
}

export class GithubApi {
  constructor(private request: APIRequestContext) { }

  async getAuthenticatedUser(): Promise<GithubUser> {
    const response = await this.request.get('/user');
    return response.json() as Promise<GithubUser>;
  }

  async getUser(username: string): Promise<GithubUser> {
    const response = await this.request.get(`/users/${username}`);
    return response.json() as Promise<GithubUser>;
  }

  async getRepos(): Promise<GithubRepo[]> {
    const response = await this.request.get('/user/repos');
    return response.json() as Promise<GithubRepo[]>;
  }

  async getRepoPage(page: number, perPage: number): Promise<GithubRepo[]> {
    const response = await this.request.get(
      `/user/repos?page=${page}&per_page=${perPage}`
    );
    return response.json() as Promise<GithubRepo[]>;
  }

  async getAllRepos(): Promise<GithubRepo[]> {
    const allRepos: GithubRepo[] = [];
    const perPage = 10;
    let page = 1;
    const maxPages = 20;

    while (page <= maxPages) {
      const repos = await this.getRepoPage(page, perPage);
      if (repos.length === 0) break;
      allRepos.push(...repos);
      if (repos.length < perPage) break;
      page++;
    }

    return allRepos;
  }
}
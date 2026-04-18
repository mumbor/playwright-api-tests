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
  constructor(private request: APIRequestContext) {}

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
}
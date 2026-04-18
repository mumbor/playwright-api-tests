import { APIRequestContext } from '@playwright/test';

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface CreatePostData {
  title: string;
  body: string;
  userId: number;
}

export class PostsApi {
  constructor(private request: APIRequestContext) {}

  async getAllPosts(): Promise<Post[]> {
    const response = await this.request.get('/posts');
    return response.json() as Promise<Post[]>;
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.request.get(`/posts/${id}`);
    return response.json() as Promise<Post>;
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await this.request.post('/posts', { data });
    return response.json() as Promise<Post>;
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    const response = await this.request.get(`/posts?userId=${userId}`);
    return response.json() as Promise<Post[]>;
  }
}
import { APIRequestContext } from '@playwright/test';
import { z } from 'zod';

export const PostSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

export const PostsArraySchema = z.array(PostSchema);

export type Post = z.infer<typeof PostSchema>;

export interface CreatePostData {
  title: string;
  body: string;
  userId: number;
}

export class PostsApi {
  constructor(private request: APIRequestContext) {}

  async getAllPosts(): Promise<Post[]> {
    const response = await this.request.get('/posts');
    return PostsArraySchema.parse(await response.json());
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.request.get(`/posts/${id}`);
    return PostSchema.parse(await response.json());
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await this.request.post('/posts', { data });
    return PostSchema.parse(await response.json());
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    const response = await this.request.get(`/posts?userId=${userId}`);
    return PostsArraySchema.parse(await response.json());
  }

  async getPostSafe(id: number) {
    const response = await this.request.get(`/posts/${id}`);
    const status = response.status();
    if (!response.ok()) {
      return { success: false as const, status };
    }
    const result = PostSchema.safeParse(await response.json());
    return { ...result, status };
  }
}
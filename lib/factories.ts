import { faker } from '@faker-js/faker';
import { CreatePostData } from './PostsApi';

export function createPostData(overrides?: Partial<CreatePostData>): CreatePostData {
  return {
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
    userId: faker.number.int({ min: 1, max: 10 }),
    ...overrides,
  };
}
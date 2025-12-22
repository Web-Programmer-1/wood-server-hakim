export interface ICategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  createdAt: Date;
}

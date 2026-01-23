import { BlogCategory, BlogStatus, HighlightBadge } from "../../constants/blog.enum";

export interface CreateBlogInput {
  title: string;
  content: string;
  excerpt?: string;
  category: BlogCategory;
  status?: BlogStatus;
  highlight?: HighlightBadge;
  coverImage?: string;
}


export interface UpdateBlogInput {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: BlogCategory;
  status?: BlogStatus;
  highlight?: HighlightBadge;
  coverImage?: string;
}

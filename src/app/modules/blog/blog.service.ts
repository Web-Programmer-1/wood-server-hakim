
import slugify from "slugify";

import { CreateBlogInput, UpdateBlogInput } from "./blog.interface";
import { prisma } from "../../shared/prisma";
import { BlogCategory, BlogStatus, HighlightBadge } from "../../constants/blog.enum";

export const createBlog = async (data: CreateBlogInput) => {
  // -------- Required validation ----------
  if (!data.title || !data.content || !data.category) {
    throw new Error("Title, content and category are required");
  }

  // -------- Enum safety ----------
  if (!Object.values(BlogCategory).includes(data.category)) {
    throw new Error("Invalid blog category");
  }

  const status = data.status ?? BlogStatus.DRAFT;
  const highlight = data.highlight ?? HighlightBadge.NONE;

  // -------- Blog highlight rule ----------
  if (
    highlight === HighlightBadge.LIVE ||
    highlight === HighlightBadge.ENDED
  ) {
    throw new Error("Invalid highlight for blog");
  }

  // -------- Slug generation ----------
  const slug = slugify(data.title, {
    lower: true,
    strict: true,
  });

  const exists = await prisma.blog.findUnique({
    where: { slug },
  });

  if (exists) {
    throw new Error("Blog with same title already exists");
  }

  // -------- publishedAt logic ----------
  const publishedAt =
    status === BlogStatus.PUBLISHED ? new Date() : null;

  return prisma.blog.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      status,
      highlight:
        status === BlogStatus.PUBLISHED
          ? highlight
          : HighlightBadge.NONE,
      coverImage: data.coverImage,
      publishedAt,
    },
  });
};








export interface GetBlogsFilters {
  status?: BlogStatus;
  category?: BlogCategory;
  highlight?: HighlightBadge;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "publishedAt" | "createdAt";
  order?: "asc" | "desc";
}

interface GetBlogsOptions {
  isAdmin: boolean;
}

export const getBlogs = async (
  filters: GetBlogsFilters,
  options: GetBlogsOptions
) => {
  const {
    status,
    category,
    highlight,
    search,
    page = 1,
    limit = 10,
    sortBy = "publishedAt",
    order = "desc",
  } = filters;

  // ---------------- Pagination ----------------
  const safePage = page > 0 ? page : 1;
  const safeLimit =
    limit > 0 && limit <= 50 ? limit : 10;

  const skip = (safePage - 1) * safeLimit;

  // ---------------- WHERE clause ----------------
  const where: any = {};

  /**
   * STATUS handling
   * - User → always PUBLISHED
   * - Admin → query based / all
   */
  if (!options.isAdmin) {
    where.status = BlogStatus.PUBLISHED;
  } else if (status) {
    if (!Object.values(BlogStatus).includes(status)) {
      throw new Error("Invalid blog status filter");
    }
    where.status = status;
  }

  /**
   * CATEGORY filter
   */
  if (category) {
    if (!Object.values(BlogCategory).includes(category)) {
      throw new Error("Invalid blog category filter");
    }
    where.category = category;
  }

  /**
   * HIGHLIGHT filter
   */
  if (highlight) {
    if (
      highlight === HighlightBadge.LIVE ||
      highlight === HighlightBadge.ENDED
    ) {
      throw new Error(
        "Invalid highlight filter for blog"
      );
    }
    where.highlight = highlight;
  }

  /**
   * SEARCH (title only, case-insensitive)
   */
  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  // ---------------- ORDER BY ----------------
  const orderBy: any = {};

  if (
    sortBy !== "publishedAt" &&
    sortBy !== "createdAt"
  ) {
    throw new Error("Invalid sortBy value");
  }

  orderBy[sortBy] = order === "asc" ? "asc" : "desc";

  // ---------------- QUERY ----------------
  const [data, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,  
        excerpt: true,
        coverImage: true,
        category: true,
        highlight: true,
        status: options.isAdmin ? true : false,
        publishedAt: true,
        createdAt: options.isAdmin ? true : false,
      },
    }),
    prisma.blog.count({ where }),
  ]);

  // ---------------- RESPONSE ----------------
  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};











export const getBlogBySlug = async (slug: string) => {
  if (!slug) {
    throw new Error("Slug is required");
  }

  const blog = await prisma.blog.findFirst({
    where: {
      slug,
      status: BlogStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      category: true,
      highlight: true,
      publishedAt: true,
    },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  return blog;
};










  

export const updateBlog = async (
  blogId: string,
  data: UpdateBlogInput
) => {
  if (!blogId) {
    throw new Error("Blog ID is required");
  }

  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // ---------- Highlight validation ----------
  if (
    data.highlight === HighlightBadge.LIVE ||
    data.highlight === HighlightBadge.ENDED
  ) {
    throw new Error("Invalid highlight for blog");
  }

  // ---------- Status ↔ highlight rules ----------
  let publishedAt = blog.publishedAt;
  let highlight = data.highlight ?? blog.highlight;

  if (data.status === BlogStatus.DRAFT) {
    publishedAt = null;
    highlight = HighlightBadge.NONE;
  }

  if (data.status === BlogStatus.ARCHIVED) {
    publishedAt = null;
    highlight = HighlightBadge.NONE;
  }

  if (
    data.status === BlogStatus.PUBLISHED &&
    !publishedAt
  ) {
    publishedAt = new Date();
  }

  // ---------- Slug update ----------
  let slug = blog.slug;
  if (data.title && data.title !== blog.title) {
    slug = slugify(data.title, {
      lower: true,
      strict: true,
    });

    const exists = await prisma.blog.findFirst({
      where: {
        slug,
        NOT: { id: blogId },
      },
    });

    if (exists) {
      throw new Error(
        "Another blog with same title exists"
      );
    }
  }

  return prisma.blog.update({
    where: { id: blogId },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      status: data.status,
      highlight,
      coverImage: data.coverImage,
      publishedAt,
    },
  });
};







export const deleteBlog = async (blogId: string) => {
  if (!blogId) {
    throw new Error("Blog ID is required");
  }

  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // Already archived → no need to delete again
  if (blog.status === BlogStatus.ARCHIVED) {
    throw new Error("Blog already archived");
  }

  return prisma.blog.update({
    where: { id: blogId },
    data: {
      status: BlogStatus.ARCHIVED,
      highlight: HighlightBadge.NONE,
      publishedAt: null,
    },
  });
};

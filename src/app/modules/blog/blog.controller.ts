import { Request, Response } from "express";
import { createBlog, deleteBlog, getBlogBySlug, getBlogs, updateBlog } from "./blog.service";


export const createBlogController = async (
  req: Request,
  res: Response
) => {
  try {
    const blog = await createBlog({
      ...req.body,
    
      coverImage: (req.file as Express.MulterS3.File)?.location,
    });

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};







/**
 * ----------------------------------------
 * ADMIN: Get All Blogs (Dashboard)
 * GET /admin/blogs
 * ----------------------------------------
 */
export const getBlogsAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getBlogs(
      {
        status: req.query.status as any,
        category: req.query.category as any,
        highlight: req.query.highlight as any,
        search: req.query.search as string,
        page: req.query.page
          ? Number(req.query.page)
          : undefined,
        limit: req.query.limit
          ? Number(req.query.limit)
          : undefined,
        sortBy: req.query.sortBy as any,
        order: req.query.order as any,
      },
      { isAdmin: true }
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};










export const getBlogBySlugController = async (
  req: Request,
  res: Response
) => {
  try {
    const blog = await getBlogBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};















export const updateBlogController = async (
  req: Request,
  res: Response
) => {
  try {
    const blog = await updateBlog(req.params.id, {
      ...req.body,
      coverImage: (req.file as Express.MulterS3.File)?.location,
    });

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};









export const deleteBlogController = async (
  req: Request,
  res: Response
) => {
  try {
    const blog = await deleteBlog(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog archived successfully",
      data: blog,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
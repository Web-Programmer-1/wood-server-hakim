import { Request, Response } from "express";
import { createEvent, deleteEvent, getDashboardAnalytics, getEventBySlug, getEvents, updateEvent } from "./event.service";













export const getDashboardAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const analytics = await getDashboardAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};






export const createEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const event = await createEvent({
      ...req.body,
      bannerImage: req.file ? (req.file as Express.MulterS3.File).location : undefined,
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};











export const getEventsController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getEvents(
      {
        status: req.query.status as any,
        category: req.query.category as any,
        highlight: req.query.highlight as any,
        location: req.query.location as string,
        search: req.query.search as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: req.query.page
          ? Number(req.query.page)
          : undefined,
        limit: req.query.limit
          ? Number(req.query.limit)
          : undefined,
        sortBy: req.query.sortBy as any,
        order: req.query.order as any,
      },
      { isAdmin: false }
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

/**
 * ----------------------------------------
 * ADMIN: Get All Events (Dashboard)
 * GET /admin/events
 * ----------------------------------------
 */
export const getEventsAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getEvents(
      {
        status: req.query.status as any,
        category: req.query.category as any,
        highlight: req.query.highlight as any,
        location: req.query.location as string,
        search: req.query.search as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
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











export const getEventBySlugController = async (
  req: Request,
  res: Response
) => {
  try {
    const event = await getEventBySlug(req.params.slug as string);

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};







export const updateEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const event = await updateEvent(req.params.id as string, {
      ...req.body,
           bannerImage: req.file ? (req.file as Express.MulterS3.File).location : undefined,
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};







export const deleteEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const event = await deleteEvent(req.params.id as string);

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: event,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};







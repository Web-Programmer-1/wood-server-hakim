
import slugify from "slugify";

import { CreateEventInput, UpdateEventInput } from "./event.interface";
import { prisma } from "../../shared/prisma";
import { BlogStatus, HighlightBadge } from "../../constants/blog.enum";
import {  EventStatus } from "../../constants/event.enum";
import { EventCategory } from "@prisma/client";








export const getDashboardAnalytics = async () => {
  const [
    // -------- BLOG COUNTS --------
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    archivedBlogs,

    // -------- EVENT COUNTS --------
    totalEvents,
    upcomingEvents,
    ongoingEvents,
    completedEvents,
    cancelledEvents,

    // -------- TOP VIEWED --------
    topBlogs,
    topEvents,

    // -------- GROUP BY --------
    blogsByCategory,
    eventsByCategory,
  ] = await Promise.all([
    prisma.blog.count(),

    prisma.blog.count({
      where: { status: BlogStatus.PUBLISHED },
    }),

    prisma.blog.count({
      where: { status: BlogStatus.DRAFT },
    }),

    prisma.blog.count({
      where: { status: BlogStatus.ARCHIVED },
    }),

    prisma.event.count(),

    prisma.event.count({
      where: { status: EventStatus.UPCOMING },
    }),

    prisma.event.count({
      where: { status: EventStatus.ONGOING },
    }),

    prisma.event.count({
      where: { status: EventStatus.COMPLETED },
    }),

    prisma.event.count({
      where: { status: EventStatus.CANCELLED },
    }),

    prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED },
    
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
     
      },
    }),

    prisma.event.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
      },
    }),

    prisma.blog.groupBy({
      by: ["category"],
      _count: { category: true },
    }),

    prisma.event.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
  ]);

  return {
    blogs: {
      total: totalBlogs,
      published: publishedBlogs,
      draft: draftBlogs,
      archived: archivedBlogs,
      byCategory: blogsByCategory.map((b:any) => ({
        category: b.category,
        count: b._count.category,
      })),
   
    },

    events: {
      total: totalEvents,
      upcoming: upcomingEvents,
      ongoing: ongoingEvents,
      completed: completedEvents,
      cancelled: cancelledEvents,
      byCategory: eventsByCategory.map((e:any) => ({
        category: e.category,
        count: e._count.category,
      })),
      topViewed: topEvents,
    },
  };
};
















export const createEvent = async (data: CreateEventInput) => {
  // -------- Required validation ----------
  if (
    !data.title ||
    !data.category ||
    !data.location ||
    !data.startDate ||
    !data.endDate
  ) {
    throw new Error(
      "Title, category, location, startDate and endDate are required"
    );
  }

  // -------- Enum safety ----------
  if (!Object.values(EventCategory).includes(data.category)) {
    throw new Error("Invalid event category");
  }

  const status = data.status ?? EventStatus.UPCOMING;
  const highlight = data.highlight ?? HighlightBadge.NONE;

  // -------- Date validation ----------
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid event dates");
  }

  if (end < start) {
    throw new Error("endDate cannot be before startDate");
  }

  // -------- Status ↔ Highlight rules ----------
  if (
    status === EventStatus.ONGOING &&
    highlight === HighlightBadge.NEW
  ) {
    throw new Error("ONGOING event cannot be NEW");
  }

  if (
    status === EventStatus.COMPLETED &&
    highlight === HighlightBadge.LIVE
  ) {
    throw new Error("COMPLETED event cannot be LIVE");
  }

  // -------- Slug generation ----------
  const slug = slugify(data.title, {
    lower: true,
    strict: true,
  });

  const exists = await prisma.event.findUnique({
    where: { slug },
  });

  if (exists) {
    throw new Error("Event with same title already exists");
  }

  return prisma.event.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      category: data.category,
      status,
      highlight,
      location: data.location,
      startDate: start,
      endDate: end,
      bannerImage: data.bannerImage,
    },
  });
};










export interface GetEventsFilters {
  status?: EventStatus;
  category?: EventCategory;
  highlight?: HighlightBadge;
  location?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "startDate" | "createdAt" | "viewCount";
  order?: "asc" | "desc";
}

interface GetEventsOptions {
  isAdmin: boolean;
}

export const getEvents = async (
  filters: GetEventsFilters,
  options: GetEventsOptions
) => {
  const {
    status,
    category,
    highlight,
    location,
    search,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    sortBy = "startDate",
    order = "asc",
  } = filters;

  // ---------------- Pagination ----------------
  const safePage = page > 0 ? page : 1;
  const safeLimit =
    limit > 0 && limit <= 50 ? limit : 10;

  const skip = (safePage - 1) * safeLimit;

  // ---------------- WHERE ----------------
  const where: any = {};

  /**
   * STATUS handling
   * - User → UPCOMING + ONGOING
   * - Admin → query based / all
   */
  if (!options.isAdmin) {
    where.status = {
      in: [EventStatus.UPCOMING, EventStatus.ONGOING],
    };
  } else if (status) {
    if (!Object.values(EventStatus).includes(status)) {
      throw new Error("Invalid event status filter");
    }
    where.status = status;
  }

  /**
   * CATEGORY filter
   */
  if (category) {
    if (!Object.values(EventCategory).includes(category)) {
      throw new Error("Invalid event category filter");
    }
    where.category = category;
  }

  /**
   * HIGHLIGHT filter
   */
  if (highlight) {
    if (!Object.values(HighlightBadge).includes(highlight)) {
      throw new Error("Invalid highlight filter");
    }
    where.highlight = highlight;
  }

  /**
   * LOCATION filter (case-insensitive)
   */
  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  /**
   * SEARCH (title)
   */
  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  /**
   * DATE RANGE
   */
  if (fromDate || toDate) {
    where.startDate = {};

    if (fromDate) {
      const from = new Date(fromDate);
      if (isNaN(from.getTime())) {
        throw new Error("Invalid fromDate");
      }
      where.startDate.gte = from;
    }

    if (toDate) {
      const to = new Date(toDate);
      if (isNaN(to.getTime())) {
        throw new Error("Invalid toDate");
      }
      where.startDate.lte = to;
    }
  }

  // ---------------- ORDER BY ----------------
  if (
    !["startDate", "createdAt", "viewCount"].includes(
      sortBy
    )
  ) {
    throw new Error("Invalid sortBy value");
  }

  const orderBy: any = {};
  orderBy[sortBy] = order === "desc" ? "desc" : "asc";

  // ---------------- QUERY ----------------
  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        status: options.isAdmin ? true : false,
        highlight: true,
        location: true,
        startDate: true,
        endDate: true,
        bannerImage: true,
        viewCount: true,
        createdAt: options.isAdmin ? true : false,
      },
    }),
    prisma.event.count({ where }),
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








export const getEventBySlug = async (slug: string) => {
  if (!slug) {
    throw new Error("Slug is required");
  }

  const event = await prisma.event.findFirst({
    where: {
      slug,
      status: {
        in: [EventStatus.UPCOMING, EventStatus.ONGOING],
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // -------- View count increment ----------
  await prisma.event.update({
    where: { id: event.id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  return event;
};







export const updateEvent = async (
  eventId: string,
  data: UpdateEventInput
) => {
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // -------- Date validation ----------
  let startDate = event.startDate;
  let endDate = event.endDate;

  if (data.startDate) {
    startDate = new Date(data.startDate);
  }
  if (data.endDate) {
    endDate = new Date(data.endDate);
  }

  if (endDate < startDate) {
    throw new Error("endDate cannot be before startDate");
  }

  // -------- Status ↔ Highlight rules ----------
  let highlight = data.highlight ?? event.highlight;

  if (data.status === EventStatus.COMPLETED) {
    highlight = HighlightBadge.ENDED;
  }

  if (data.status === EventStatus.ONGOING) {
    highlight = HighlightBadge.LIVE;
  }

  if (data.status === EventStatus.CANCELLED) {
    highlight = HighlightBadge.NONE;
  }

  // -------- Slug update ----------
  let slug = event.slug;

  if (data.title && data.title !== event.title) {
    slug = slugify(data.title, {
      lower: true,
      strict: true,
    });

    const exists = await prisma.event.findFirst({
      where: {
        slug,
        NOT: { id: eventId },
      },
    });

    if (exists) {
      throw new Error(
        "Another event with same title exists"
      );
    }
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      slug,
      description: data.description,
      category: data.category,
      status: data.status,
      highlight,
      location: data.location,
      startDate,
      endDate,
      bannerImage: data.bannerImage,
    },
  });
};








export const deleteEvent = async (eventId: string) => {
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Already cancelled → prevent double delete
  if (event.status === EventStatus.CANCELLED) {
    throw new Error("Event already cancelled");
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: EventStatus.CANCELLED,
      highlight: HighlightBadge.NONE,
    },
  });
};

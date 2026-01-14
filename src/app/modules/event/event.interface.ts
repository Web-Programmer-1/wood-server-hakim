import {
  EventCategory,
  EventStatus,
  HighlightBadge,
} from "@prisma/client";

export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  status?: EventStatus;
  highlight?: HighlightBadge;
  location: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  bannerImage?: string;
}







export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: EventCategory;
  status?: EventStatus;
  highlight?: HighlightBadge;
  location?: string;
  startDate?: string;
  endDate?: string;
  bannerImage?: string;
}

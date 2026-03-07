
export type ICreateTestimonialPayload = {
  avatarUrl?: string;
  cardBgImageUrl?: string;

  description?: string;
  personName?: string;
  companyName?: string;

  videoType?: string;   // "YOUTUBE" | "UPLOAD"
  youtubeUrl?: string;
  videoUrl?: string;

  sortOrder?: number;
};



export type IGetAllTestimonialQuery = {
  page?: number;
  limit?: number;
};
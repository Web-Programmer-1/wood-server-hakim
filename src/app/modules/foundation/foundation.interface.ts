export type ICreateFoundationStoryPayload = {
  title: string;
  slug: string;
  description?: string;

  cardImageUrl: string;

  videoType?: string;
  youtubeUrl?: string;
  videoUrl?: string;

  galleryImages?: any;

  sortOrder?: number;
};




export type IGetAllFoundationStoryQuery = {
  search?: string;
  page?: number;
  limit?: number;
};
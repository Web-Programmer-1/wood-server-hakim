export type ICreateShadhinotaPayload = {
  title: string;
  subtitles?: string[];
  sortOrder?: number;
  imageUrls: string[];
};

export type IUpdateShadhinotaPayload = {
  title?: string;
  subtitles?: string[];
  sortOrder?: number;
};

export type IGetAllShadhinotaQuery = {
  search?: string;
  page?: number;
  limit?: number;
};

export type ICreateConsultencyBannerPayload = {
  subHeading?: string;
  heading: string;
  buttonText?: string;
  buttonUrl?: string;
  tagOne?: string;
  tagTwo?: string;
  tagThree?: string;
  bgImageUrl: string;
  sortOrder?: number;
};

export type IUpdateConsultencyBannerPayload = {
  subHeading?: string;
  heading?: string;
  buttonText?: string;
  buttonUrl?: string;
  tagOne?: string;
  tagTwo?: string;
  tagThree?: string;
  bgImageUrl?: string;
  sortOrder?: number;
};

export type IGetAllConsultencyBannerQuery = {
  page?: number;
  limit?: number;
};
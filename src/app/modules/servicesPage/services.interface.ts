export type ICreateServiceSectionPayload = {
  heading: string;
  description?: string;

  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
  
  bgImageUrl: string;
  sortOrder?: number; // optional (default 0)
};






export type IUpdateServiceSectionPayload = {
  heading?: string;
  description?: string;

  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;

  bgImageUrl?: string; 
  sortOrder?: number;
};
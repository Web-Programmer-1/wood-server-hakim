export interface IMachine {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  categoryId: string;

  thumbnailImage: string;
  bannerImage?: string;

  features: Record<string, any>;
  specifications: Record<string, any>;

  isFeatured: boolean;
  isActive: boolean;

  //  new added fields for pricing
  listPrice: number;
  discountPercent?: number;
  discountPrice?: number;
   bookedQty: number;

  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMachineImage {
  id: string;
  machineId: string;
  imageUrl: string;
  type: "THUMBNAIL" | "BANNER" | "GALLERY";
  createdAt: Date;
}

export interface IMachineVideo {
  id: string;
  machineId: string;
  videoUrl: string;
  createdAt: Date;
}








export interface CreateMachinePayload {
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  categoryId: string;

  thumbnailImage: string;
  bannerImage?: string;
  stockQuantity: number;
  features: Record<string, any>;
  specifications: Record<string, any>;

  isFeatured?: boolean;
}









export interface UpdateMachinePayload {
  name?: string;
  slug?: string;
  shortDesc?: string;
  description?: string;
  categoryId?: string;

  thumbnailImage?: string;
  bannerImage?: string;

  features?: Record<string, any>;
  specifications?: Record<string, any>;
  stockQuantity?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}










 export type GetMachinesParams = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  sortBy: "createdAt" | "name";
  sortOrder: "asc" | "desc";
};


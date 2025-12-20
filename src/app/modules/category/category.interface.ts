// src/modules/category/category.interface.ts

export interface ICategoryBase {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  showOnHome?: boolean;
}

// ------------------------------
// Create Category (No Parent)
// ------------------------------
export interface ICategoryCreate extends ICategoryBase {

  parentId?: null; // main category parent থাকে না
}

// ------------------------------
// Create Subcategory
// ------------------------------
export interface ISubCategoryCreate extends ICategoryBase {
  parentId: string; // subcategory must have a parent
}

// ------------------------------
// Update Category
// ------------------------------
export interface ICategoryUpdate {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  showOnHome?: boolean;
  parentId?: string | null;
}

// ------------------------------
// Response Structure (Includes Children)
// ------------------------------
export interface ICategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  showOnHome: boolean;
  parentId?: string | null;
  children?: ICategoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

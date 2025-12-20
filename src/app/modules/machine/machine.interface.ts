export interface IMachine {
  id: string;
  title: string;
  slug: string;
  description?: string;

  categoryId: string;

  brand?: string;
  model?: string;

  features?: Record<string, any>;
  techSpecs?: Record<string, any>;
  dynamicButtons?: Record<string, any>;

  visibility: boolean;

  createdAt: Date;
  updatedAt: Date;
}












export interface ICreateMachinePayload {
  title: string;
  slug: string;
  categoryId: string;

  description?: string;
  brand?: string;
  model?: string;

  features?: Record<string, any>;
  techSpecs?: Record<string, any>;
  dynamicButtons?: Record<string, any>;
}








export interface IUpdateMachinePayload {
  title?: string;
  slug?: string;
  description?: string;

  categoryId?: string;

  brand?: string;
  model?: string;

  features?: Record<string, any>;
  techSpecs?: Record<string, any>;
  dynamicButtons?: Record<string, any>;

  visibility?: boolean;
}

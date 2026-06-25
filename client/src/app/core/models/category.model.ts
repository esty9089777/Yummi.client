export interface ICategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

/** Sent to POST /categories */
export interface ICreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
}

/** Sent to PATCH /categories/:id */
export interface IUpdateCategoryDto {
  name?: string;
  description?: string;
  image?: string;
}

export interface ICategoryResponse {
  category: ICategory;
}

export interface ICategoriesResponse {
  categories: ICategory[];
}

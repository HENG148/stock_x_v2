export interface CategoryDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: Date;
}

export interface CategoryDetailDto extends CategoryDto {
  children: CategoryDto[];
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  parentId?: string | null;
}
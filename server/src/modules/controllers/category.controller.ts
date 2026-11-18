import { Request, Response } from "express";
import { sendNoContent, sendSuccess } from "../../utils/response";
import { categoryService, CategoryService } from "../service/category.service";
import { CreateCategoryBody, updateCategoryBody } from "../validations/categories.validation";

export class CategoryController {
  constructor(private readonly service: CategoryService = categoryService) { }
  list = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.list())
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.validated?.params as { slug: string };
    sendSuccess(res, await this.service.getBySlug(slug));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateCategoryBody;
    sendSuccess(res, await this.service.create(body), 201);
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    const body = req.validated?.body as updateCategoryBody;
    sendSuccess(res, await this.service.update(id, body));
  }

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    await this.service.delete(id);
    sendNoContent(res);
  }
}

export const categoryController = new CategoryController();
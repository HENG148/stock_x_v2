import { Request, Response } from "express";
import { productService, ProductService } from "../service/product.service";
import { CreateProductBody, ListProductsQuery, UpdateProductBody } from "../validations/products.validation";
import { buildPaginationMeta, sendNoContent, sendSuccess } from "../../utils/response";

export class ProductController {
  constructor(private readonly service: ProductService = productService) { }
  
  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListProductsQuery;
    const { items, total } = await this.service.list(query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  }

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.validated?.params as { slug: string };
    sendSuccess(res, await this.service.getBySlug(slug));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateProductBody;
    sendSuccess(res, await this.service.create(body), 201);
  }

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string }
    const body = req.validated?.params as UpdateProductBody;
    sendSuccess(res, await this.service.update(id, body));
  }

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string }
    await this.service.delete(id);
    sendNoContent(res);
  }
}

export const productController = new ProductController();
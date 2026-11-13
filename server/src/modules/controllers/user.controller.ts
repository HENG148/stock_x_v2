import { Request, Response } from "express";
import { AppError } from "../../shared/error/app-error";
import { userService, UserService } from "../service/user.service";
import { buildPaginationMeta, sendSuccess } from "../../utils/reponse";
import { ListUsersQuery, UpdateProfileBody, UpdateRoleBody } from "../validations/user.validation";

function requireUser(req: Request): NonNullable<Request["user"]>{
  if (!req.user) throw AppError.unauthenticated();
  return req.user;
}

export class UserController {
  constructor(private readonly service: UserService = userService) {}
 
  getMe = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getById(requireUser(req).id));
  };
 
  updateMe = async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as UpdateProfileBody;
    sendSuccess(res, await this.service.updateProfile(requireUser(req).id, body));
  };
 
  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.validated?.query as ListUsersQuery;
    const { items, total } = await this.service.list(query);
    sendSuccess(res, items, 200, buildPaginationMeta(query.page, query.limit, total));
  };
 
  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    sendSuccess(res, await this.service.getById(id));
  };
 
  changeRole = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.validated?.params as { id: string };
    const { role } = req.validated?.body as UpdateRoleBody;
    sendSuccess(res, await this.service.changeRole(requireUser(req).id, id, role));
  };
}
 
export const userController = new UserController();
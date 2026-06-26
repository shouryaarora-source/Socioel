import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import commentsRouter from "./comments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(categoriesRouter);

export default router;

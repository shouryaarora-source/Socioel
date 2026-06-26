import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import commentsRouter from "./comments";
import storageRouter from "./storage";
import authRouter from "./auth";
import notificationsRouter from "./notifications";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(authRouter);
router.use(eventsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(notificationsRouter);
router.use(pushRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import primevoraRouter from "./primevora";

const router: IRouter = Router();

router.use(healthRouter);
router.use(primevoraRouter);

export default router;

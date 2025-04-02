import { Router } from "express";
import {getContentFromLLM, template} from "../controllers/chat.controller.js"

const router = Router();

router.route("/template").post(template)
router.route("/get-code").post(getContentFromLLM) 

export {router};
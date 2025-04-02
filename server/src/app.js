import dotenv from "dotenv";
import express from "express";
import {router as chatRouter} from "./routes/chat.route.js"
import cors from "cors"

dotenv.config({
    path: "./.env" 
})


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}))

app.use(express.json( { limit : "1mb" } ))
app.use(express.urlencoded({extended : true}))
app.use("/api/v1/chat", chatRouter)




export {app}
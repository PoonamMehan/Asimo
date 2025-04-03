import dotenv from "dotenv";
import express from "express";
import {router as chatRouter} from "./routes/chat.route.js"
import cors from "cors"
import path from 'path'
import {fileURLToPath} from 'url';

dotenv.config({
    path: "./.env" 
})
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}))

app.use(express.json( { limit : "1mb" } ))
app.use(express.urlencoded({extended : true}))
app.use("/api/v1/chat", chatRouter)


app.use(express.static(path.join(__dirname, '../client/dist')))
app.get('*', (req, res) => 
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
);




export {app}
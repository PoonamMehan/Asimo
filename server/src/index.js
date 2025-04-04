import dotenv from "dotenv";
import {app} from "./app.js"

dotenv.config({
    path: "./.env"
})

const portNum = process.env.PORT || 3000
const server = app.listen(portNum, ()=>{console.log(`Server is listening on port: ${portNum}`)})
server.on("error", (error)=>{console.log("Server failed to listen: ", error)})
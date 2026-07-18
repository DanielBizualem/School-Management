import express from "express";

import mongoose from "mongoose";

import dotenv from "dotenv";
import { connectDB } from "./config/Connect.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import directorRoutes from "./routes/directorRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoute from "./routes/userRoute.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", // Your exact Next.js frontend local web URL
    credentials: true
}));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/director", directorRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use('/api', uploadRoutes)
app.use("/api/user",userRoute)

const PORT = process.env.PORT || 5000;




connectDB()
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log("server is running on port " + PORT);
})



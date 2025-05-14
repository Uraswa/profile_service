import dotenv from "dotenv"

dotenv.config();

import express from 'express'
import cors from "cors";
import cookieParser from "cookie-parser";
import ProfilesController from "./profilesController.js";
import authMiddleware from "./middleware/auth-middleware.js";

const app = express()
app.use(express.json())
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:9000", // или true для любого origin
    credentials: true, // разрешаем куки и авторизационные заголовки
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(authMiddleware)

const router = express.Router()
app.use(router);
app.disable('etag');

router.get('/api/getUserProfilesByIds', ProfilesController.getUserProfilesByIds.bind(ProfilesController));
router.get('/api/getProfiles', ProfilesController.getProfiles.bind(ProfilesController));
router.get('/api/getProfile', ProfilesController.getProfile.bind(ProfilesController));
router.post('/api/createProfile', ProfilesController.createProfile.bind(ProfilesController));
router.post('/api/updateProfile', ProfilesController.updateProfile.bind(ProfilesController));
app.listen(8001, () => {
    console.log("Profile service is running...")
})
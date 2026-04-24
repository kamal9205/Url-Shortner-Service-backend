import "dotenv/config";
import express from "express";
import connectToMongoDB from "./connect.js";
import URL from "./models/url.js";
import router from "./routes/url.js";
import { userRouter } from "./routes/user.js";
import cors from "cors";

const app = express();

app.use(cors({
    // origin: ["http://localhost:5173", "https://your-frontend.vercel.app"],
      origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

connectToMongoDB(process.env.MONGO_URL || "mongodb://localhost:27017/short-url")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

const PORT = Number(process.env.PORT) || 8001;

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Backend is running");
});
app.use("/url", router);
app.use("/user", userRouter);
app.get('/:shortId', async (req, res) => {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
        {
            shortId
        },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now(),
                }
            }
        }
    )
    if (!entry) {
        return res.status(404).json({ error: "Short URL not found" });
    }
    
    return res.redirect(entry.redirectURL)
})


app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));
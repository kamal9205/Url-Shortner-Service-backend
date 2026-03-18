import express from "express";
import connectToMongoDB from "./connect.js";
import URL from "./models/url.js";

import router from "./routes/url.js";
import { userRouter } from "./routes/user.js";
import cors from "cors"


const app = express();


app.use(cors({
  origin: "https://url-shortner-service-gules.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}))
connectToMongoDB(process.env.MONGO_URL || "mongodb://localhost:27017/short-url")
.then(() => console.log("MongoDB connected"));

const PORT = Number(process.env.PORT) || 8001;

app.use(express.json());
app.get('/:shortId',async (req,res)=> {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
        {
            shortId
        } ,
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


app.use("/url", router);
app.use("/user", userRouter);


app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));
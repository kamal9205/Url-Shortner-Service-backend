import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import xss from "xss-clean";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectToMongoDB from "./connect.js";
import URL from "./models/url.js";
import router from "./routes/url.js";
import { userRouter } from "./routes/user.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(morgan("dev"));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-project.vercel.app"
  ],
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/url", router);
app.use("/user", userRouter);

app.get("/:shortId", async (req, res, next) => {
  try {
    const entry = await URL.findOneAndUpdate(
      { shortId: req.params.shortId },
      {
        $push: {
          visitHistory: {
            $each: [{ timestamp: Date.now() }],
            $slice: -1000
          }
        }
      }
    );

    if (!entry) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    res.redirect(entry.redirectURL);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

(async () => {
  try {
    await connectToMongoDB(process.env.MONGO_URL);
    console.log("MongoDB connected");

    app.listen(PORT, () =>
      console.log(`Server running on ${PORT}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
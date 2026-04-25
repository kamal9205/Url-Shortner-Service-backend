// controllers/url.js

import validator from "validator";
import shortURL from "../utils/shortUrl.js";
import URL from "../models/url.js";

function isValidCustomId(value) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

async function handleGenerateNewUrl(req, res) {
  try {
    const { url } = req.body;

    if (
      !url ||
      !validator.isURL(url, {
        require_protocol: true,
      })
    ) {
      return res.status(400).json({
        error: "Valid URL is required",
      });
    }

    const rawCustomId =
      req.body?.customId ??
      req.body?.customID ??
      req.body?.custom_id ??
      req.body?.shortId ??
      req.body?.shortID ??
      req.body?.short_id;

    const requestedCustomId =
      typeof rawCustomId === "string" ? rawCustomId.trim() : "";

    const reserved = new Set(["url", "user", "analytics"]);

    let shortID = "";

    if (requestedCustomId) {
      if (!isValidCustomId(requestedCustomId)) {
        return res.status(400).json({
          error:
            "Custom ID must be 3-32 chars and only letters, numbers, - or _",
        });
      }

      if (reserved.has(requestedCustomId.toLowerCase())) {
        return res.status(400).json({
          error: "This Custom ID is reserved",
        });
      }

      const exists = await URL.findOne({
        shortId: requestedCustomId,
      }).lean();

      if (exists) {
        return res.status(409).json({
          error: "Custom ID already taken",
        });
      }

      shortID = requestedCustomId;
    } else {
      for (let i = 0; i < 5; i++) {
        const candidate = shortURL(6);

        const exists = await URL.findOne({
          shortId: candidate,
        }).lean();

        if (!exists) {
          shortID = candidate;
          break;
        }
      }

      if (!shortID) {
        return res.status(500).json({
          error: "Could not generate a unique short id",
        });
      }
    }

    const newUrl = await URL.create({
      shortId: shortID,
      redirectURL: url,
      visitHistory: [],
      createdBy: req.user ? req.user._id : undefined,
    });

    return res.status(201).json({
      id: newUrl.shortId,
      redirectURL: newUrl.redirectURL,
      createdAt: newUrl.createdAt,
    });
  } catch (error) {
    console.error("Create URL Error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

async function handleGetAnalytics(req, res) {
  try {
    const { shortId } = req.params;

    const result = await URL.findOne({ shortId }).lean();

    if (!result) {
      return res.status(404).json({
        error: "Short URL not found",
      });
    }

    return res.status(200).json({
      shortId: result.shortId,
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory.slice(-100),
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export { handleGenerateNewUrl, handleGetAnalytics };
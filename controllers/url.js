import shortURL from "../utils/shortUrl.js";
import URL from "../models/url.js";

function isValidCustomId(value) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

async function handleGenerateNewUrl(req, res) {
  const body = req.body;

  if (!body.url) {
    return res.status(400).json({ error: "Url is required" });
  }

  const rawCustomId =
    body?.customId ??
    body?.customID ??
    body?.custom_id ??
    body?.shortId ??
    body?.shortID ??
    body?.short_id;

  const requestedCustomId = typeof rawCustomId === "string" ? rawCustomId.trim() : "";
  const reserved = new Set(["url", "user", "analytics"]);

  let shortID = "";
  if (requestedCustomId) {
    if (!isValidCustomId(requestedCustomId)) {
      return res.status(400).json({
        error: "Custom ID must be 3-32 chars and only letters, numbers, - or _",
      });
    }
    if (reserved.has(requestedCustomId.toLowerCase())) {
      return res.status(400).json({ error: "This Custom ID is reserved" });
    }
    const exists = await URL.findOne({ shortId: requestedCustomId }).lean();
    if (exists) {
      return res.status(409).json({ error: "Custom ID already taken" });
    }
    shortID = requestedCustomId;
  } else {
    // Generate a random id; retry on rare collisions
    for (let i = 0; i < 5; i++) {
      const candidate = shortURL(6);
      const exists = await URL.findOne({ shortId: candidate }).lean();
      if (!exists) {
        shortID = candidate;
        break;
      }
    }
    if (!shortID) {
      return res.status(500).json({ error: "Could not generate a unique short id" });
    }
  }

  await URL.create({
    shortId: shortID,
    redirectURL: body.url,
    visitHistory: []
  });

  return res.json({ id: shortID });
}

async function handleGetAnalytics(req, res) {
  const shortId = req.params.shortId;
  const result = await URL.findOne({ shortId });
  if (!result) {
    return res.status(404).json({ error: "Short URL not found" });
  }
  return res.json({
    totalClicks: result.visitHistory.length, 
    Analytics: result.visitHistory
  })
}

export { handleGenerateNewUrl, handleGetAnalytics };
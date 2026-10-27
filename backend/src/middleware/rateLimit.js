const buckets = new Map();

function rateLimit(req, res, next) {
  if (req.method !== "POST" || req.path !== "/analyze") return next();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 10;
  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.start + windowMs - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } });
  }
  next();
}

module.exports = rateLimit;

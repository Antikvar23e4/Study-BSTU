// middleware/auth.js
const VALID_USER_TOKEN = "valid-user-token";
const VALID_ADMIN_TOKEN = "valid-admin-token";

export const requireAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (
    !apiKey ||
    (apiKey !== VALID_USER_TOKEN && apiKey !== VALID_ADMIN_TOKEN)
  ) {
    return res
      .status(401)
      .json({ error: "Unauthorized: API key is missing or invalid" });
  }
  req.userRole = apiKey === VALID_ADMIN_TOKEN ? "admin" : "user";
  next();
};

export const requireAdminAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== VALID_ADMIN_TOKEN) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  req.userRole = "admin";
  next();
};

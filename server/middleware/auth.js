const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from server/.env");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The account associated with this token no longer exists.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      authorId: user.authorId,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate the request.",
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};

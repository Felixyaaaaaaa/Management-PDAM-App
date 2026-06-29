import jwt from "jsonwebtoken";
console.log('[AUTH MIDDLEWARE] Loaded\n');

export default (req, res, next) => {
  try {
    console.log(`[AUTH] Validating token from: ${req.method} ${req.path}`);
    
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('[AUTH] ✗ Token NOT FOUND');
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log('[AUTH] Token found, verifying...');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    console.log(`[AUTH] ✓ Token valid - User ID: ${decoded.id}, Role: ${decoded.role}\n`);

    next();

  } catch (error) {
    console.log(`[AUTH] ✗ Token validation FAILED: ${error.message}\n`);
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }
};

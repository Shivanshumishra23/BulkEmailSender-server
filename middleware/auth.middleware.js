const jwt = require("jsonwebtoken");
const secret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
  
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  // Extract token from 'Bearer <token>'
  const tokenParts = token.split(" ");

  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer" || !tokenParts[1]) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid token format" });
  }

  const jwtToken = tokenParts[1];

  try {
    // Verify the token
    const decoded = await jwt.verify(jwtToken, secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("jwt verify error: " + error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

module.exports = {
  authenticate,
};

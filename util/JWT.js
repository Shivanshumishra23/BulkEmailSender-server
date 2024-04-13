const jwt = require("jsonwebtoken");

const secret = process.env.SECRET_KEY;

const createJWTTOken = async (user, next) => {
  try {
    const token = await jwt.sign(
      {
        _id: user._id,
        email: user.email,
        roles: user.roles,
      },
      secret,
      {
        expiresIn: 60 * 60 * 24,
      }
    );
    return token;
  } catch (error) {
    console.log("jwt sign error: " + error);
    return res.status(500).json({ message: error.message });
  }
};

const verifyToken = async (token) => {
  try {
    const decoded = await jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    return res.status(401).json({ message: "Invalid signature token" });
  }
};

module.exports = {
  createJWTTOken,
  verifyToken,
};

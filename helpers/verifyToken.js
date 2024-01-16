const jwt = require("jsonwebtoken");

const verifyToken = async authorization => {
  const token = authorization;
  const [, tokenWithoutBearer] = token.split(" ");
  //   console.log(tokenWithoutBearer);
  const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
  console.log(decoded.id);
  const user_id = decoded.id;

  return user_id;
};

module.exports = {
  verifyToken
};

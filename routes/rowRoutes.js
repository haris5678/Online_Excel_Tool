var express = require("express");
var router = express.Router();
var rowController = require("../controllers/rowController");
var jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send("We need a token");
  } else {
    const token = authHeader.split(" ")[1]; // Get token from Bearer Token
    console.log(token);
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log("you failed authenticate");
        res
          .status(401)
          .json({ auth: false, message: "you failed authenticate" });
      } else {
        req.userId = decoded.id;
        console.log("you authenticated");
        next();
      }
    });
  }
};

router.post("/addRowAsGroupA", verifyToken, rowController.addRow);
router.patch("/editRow", verifyToken, rowController.editRow);
router.delete("/deleteRow", verifyToken, rowController.deleteRow);

module.exports = router;

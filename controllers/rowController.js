var userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
var ObjectId = require("mongodb").ObjectID;
const mongoose = require("mongoose");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const { sendEmail } = require("../helpers/sendEmail");
const { sendMessage } = require("../helpers/sendMessage");
const otpModel = require("../models/otpModel");
const Role = require("../models/Role");
// const Row = require("../models/rows");
const TestRow = require("../models/myrows");
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
var jwt = require("jsonwebtoken");
const { verifyToken } = require("../helpers/VerifyToken");
const getUserGroup = require("../helpers/getUserGroup");
// const {}
// const userModel = require("../models/userModel");
// const verifyToken = require("../helpers/verifyToken")

// const addRow = async (req, res) => {
//   const user_id = await verifyToken(req.headers.authorization);
//   console.log("user id is ", user_id);
//   try {
//     console.log("acces token is ", req.headers);
//     const {
//       userID,
//       targetDN,
//       outsource,
//       dmRatio,
//       nonPalletized40HQQty
//     } = req.body;

//     const newRow = new Row({
//       userID: user_id,
//       targetDN,
//       outsource,
//       dmRatio,
//       nonPalletized40HQQty
//     });

//     await newRow.save();

//     return res.status(200).json({
//       success: true,
//       message: "OTP has been sent.",
//       data: newRow
//     });
//   } catch (err) {
//     console.log(err);
//     if (err.isJoi) {
//       return res.status(422).json({
//         success: false,
//         message: err.details[0].message
//       });
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Internal Server Error"
//       });
//     }
//   }
// };

const addRow = async (req, res) => {
  try {
    // Verify the token and get the user ID
    const user_id = await verifyToken(req.headers.authorization);

    const userGroup = await getUserGroup(user_id);

    // Extract relevant data from the request body
    const {
      targetDN,
      outsource,
      dmRatio,
      nonPalletized40HQQty,
      shippingFreigt,
      duty,
      landedCost
    } = req.body;

    // return;

    // Create a new row based on the user group

    let newRow;
    if (userGroup === "Group A") {
      newRow = new TestRow({
        GroupA: {
          userID: user_id,
          targetDN,
          outsource,
          dmRatio,
          nonPalletized40HQQty
        }
      });
    } else if (userGroup === "Group B") {
      console.log("in group b");
      newRow = new TestRow({
        // userID: user_id,
        GroupB: {
          userID: user_id,
          "shippingFreigt.formula": shippingFreigt,
          "duty.formula": duty,
          "landedCost.formula": landedCost
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "User not allowed to add rows."
      });
    }

    // Save the new row to the database
    await newRow.save();

    return res.status(200).json({
      success: true,
      message: "Row has been added successfully.",
      data: newRow
    });
  } catch (err) {
    console.error(err);

    if (err.isJoi) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  }
};

const editRow = async (req, res) => {
  try {
    const user_id = await verifyToken(req.headers.authorization);

    const userGroup = await getUserGroup(user_id);
    console.log("my group", userGroup);

    const {
      rowId,
      targetDN,
      outsource,
      dmRatio,
      nonPalletized40HQQty,
      shippingFreigt,
      duty,
      landedCost
    } = req.body;

    console.log("row id is ", rowId);

    // console.log("row id in shecma is ", Row._id)

    console.log("testing");

    if (!mongoose.Types.ObjectId.isValid(rowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format."
      });
    }

    console.log("testing end");

    // if (!rowId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Row ID is required for editing."
    //   });
    // }

    const existingRow = await TestRow.findById(rowId);

    // console.log("Existing Row is ", existingRow);

    if (!existingRow) {
      return res.status(404).json({
        success: false,
        message: "Row not found."
      });
    }

    console.log("Existing User id is ", existingRow.GroupA.userID);
    if (userGroup === "Group A") {
      // Group A can provide any subset of these fields
      const allowedFields = [
        "rowId",
        "targetDN",
        "outsource",
        "dmRatio",
        "nonPalletized40HQQty"
      ];
      const providedFields = Object.keys(req.body);
      const invalidFields = providedFields.filter(
        field => !allowedFields.includes(field)
      );

      console.log("invalid field is ", invalidFields);

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid field(s) for Group A: ${invalidFields.join(", ")}.`
        });
      }
      console.log(existingRow.GroupA.userID.toString()), console.log(
        user_id.toString()
      );
      if (existingRow.GroupA.userID.toString() === user_id.toString()) {
        existingRow.GroupA.targetDN = targetDN || existingRow.GroupA.targetDN;
        existingRow.GroupA.outsource =
          outsource || existingRow.GroupA.outsource;
        existingRow.GroupA.dmRatio = dmRatio || existingRow.GroupA.dmRatio;
        existingRow.GroupA.nonPalletized40HQQty =
          nonPalletized40HQQty || existingRow.GroupA.nonPalletized40HQQty;
        await existingRow.save();
      } else {
        return res.status(403).json({
          success: false,
          message: "Permission denied. You are not allowed to edit this row."
        });
      }
    } else if (userGroup === "Group B") {
      // console.log("user in if condition of B ", userGroup);
      // Group B can provide any subset of these fields
      const allowedFields = [
        "rowId",
        "shippingFreigt",
        "duty",
        "landedCost"
        // "nonPalletized40HQQty"
      ];
      const providedFields = Object.keys(req.body);
      const invalidFields = providedFields.filter(
        field => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid field(s) for Group B: ${invalidFields.join(", ")}.`
        });
      }
      // if (!existingRow.GroupB.userID) {
      //   existingRow.GroupB.userID = user_id.toString();
      //   // console.log("group b user id is not found", existingRow.GroupB.userID);
      // }

      // if (existingRow.GroupB.userID.toString() === user_id.toString()) {
      // console.log("in if after check");

      existingRow.GroupB.shippingFreigt.formula =
        shippingFreigt || existingRow.GroupB.shippingFreigt.formula;

      existingRow.GroupB.duty.formula = duty || existingRow.GroupB.duty.formula;

      existingRow.GroupB.landedCost.formula =
        landedCost || existingRow.GroupB.landedCost.formula;
      await existingRow.save();
      // } else {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Permission denied. You are not allowed to edit this row."
      //   });
      // }
    }

    return res.status(200).json({
      success: true,
      message: "Row has been updated successfully.",
      data: existingRow
    });

    // console.log("Existing Row is ", existingRow);
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  }
};

// const editRow = async (req, res) => {
//   try {
//     const { userID, rowID, editObj } = req.body;

//     const row = await Row.findOne({ rowID });
//     if (!row) {
//       return res.status(404).json({
//         success: false,
//         message: "Row not found with this ID",
//         data: null
//       });
//     }
//     if (row.userID !== userID) {
//       return res.status(401).json({
//         success: false,
//         message: "You don't have the privilage to Edit this Row",
//         data: null
//       });
//     }
//     // console.log("ADD ROW")

//     const newRow = new Row({
//       userID,
//       targetDN,
//       outsource,
//       dmRatio,
//       nonPalletized40HQQty
//     });

//     await newRow.save();

//     return res.status(200).json({
//       success: true,
//       message: "OTP has been sent.",
//       data: newRow
//     });
//   } catch (err) {
//     console.log(err);
//     if (err.isJoi) {
//       return res.status(422).json({
//         success: false,
//         message: err.details[0].message
//       });
//     } else {
//       return res.status(500).json({
//         success: false,
//         message: "Internal Server Error"
//       });
//     }
//   }
// };

const deleteRow = async (req, res) => {
  try {
    const { userID, rowID } = req.body;
    const row = await Row.findOne({ rowID });
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Row not found with this ID",
        data: null
      });
    }
    if (row.userID !== userID) {
      return res.status(401).json({
        success: false,
        message: "You don't have the privilage to Delete this Row",
        data: null
      });
    }
    // console.log("ADD ROW")

    const delRow = await Row.findByIdAndDelete(rowID);

    return res.status(200).json({
      success: true,
      message: "Row Deleted Successfully"
    });
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  }
};

module.exports = {
  addRow,
  editRow
  // deleteRow
};

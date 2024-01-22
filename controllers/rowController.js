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
const { getUserGroup } = require("../helpers/getUserGroup");

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
      landedCost,
      outbound,
      commission,
      defectiveReturn,
      otherVariableCost
    } = req.body;

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
    } else {
      //------------------------------Logic start---------------------------

      // Logic for add new row as member of Group B

      // else if (userGroup === "Group B") {
      //   console.log("in group b");
      //   newRow = new TestRow({
      //     // userID: user_id,
      //     GroupB: {
      //       userID: user_id,
      //       "shippingFreigt.formula": shippingFreigt,
      //       "duty.formula": duty,
      //       "landedCost.formula": landedCost,
      //       "outbound.formula": outbound,
      //       "commission.formula": commission,
      //       "defectiveReturn.formula": defectiveReturn,
      //       "otherVariableCost.formula": otherVariableCost
      //     }
      //   });
      // }

      //------------------------------Logic start---------------------------
      return res.status(403).json({
        success: false,
        message: `${userGroup} are not allowed to add rows`
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

//-----------------------------------------------edit Row------------------------------------------

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
      landedCost,
      outbound,
      commission,
      defectiveReturn,
      otherVariableCost
    } = req.body;

    // console.log("row id is ", rowId);

    // console.log("testing");

    if (!mongoose.Types.ObjectId.isValid(rowId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format."
      });
    }

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

        const updateExistingRow = await TestRow.findById(rowId);

        if (
          !(
            existingRow.GroupA.targetDN == null ||
            existingRow.GroupA.targetDN == "" ||
            existingRow.GroupA.targetDN == undefined
          )
        ) {
          updateExistingRow.GroupB.outbound.value = parseFloat(
            (existingRow.GroupA.targetDN * 0.0675).toFixed(2)
          );

          updateExistingRow.GroupB.commission.value = parseFloat(
            (existingRow.GroupA.targetDN * 0.0981).toFixed(2)
          );

          updateExistingRow.GroupB.defectiveReturn.value = parseFloat(
            (existingRow.GroupA.targetDN * 0.0149).toFixed(2)
          );

          updateExistingRow.GroupB.otherVariableCost.value = parseFloat(
            (existingRow.GroupA.targetDN * 0.0325).toFixed(2)
          );

          await updateExistingRow.save();
        } else {
          return res.status(403).json({
            success: false,
            message: "Invalid TargetDN value "
          });
        }

        await existingRow.save();
      } else {
        return res.status(403).json({
          success: false,
          message: "Permission denied. You are not allowed to edit this row."
        });
      }
    } else if (userGroup === "Group B") {
      console.log("user in if condition of B ", userGroup);
      // Group B can provide any subset of these fields
      const allowedFields = [
        "rowId",
        "shippingFreigt",
        "duty",
        "landedCost",
        "outbound",
        "commission",
        "defectiveReturn",
        "otherVariableCost"
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


      //--------------------Logic start---------------------------

      //loogic for if same Group memeber is allowed to enter formula in same row

      // if (!existingRow.GroupB.userID) {
      //   existingRow.GroupB.userID = user_id.toString();
      //   // console.log("group b user id is not found", existingRow.GroupB.userID);
      // }

      //--------------------Logic start---------------------------

      existingRow.GroupB.shippingFreigt.formula =
        shippingFreigt || existingRow.GroupB.shippingFreigt.formula;

      existingRow.GroupB.duty.formula = duty || existingRow.GroupB.duty.formula;

      existingRow.GroupB.landedCost.formula =
        landedCost || existingRow.GroupB.landedCost.formula;

      existingRow.GroupB.outbound.formula =
        outbound || existingRow.GroupB.outbound.formula;

      existingRow.GroupB.commission.formula =
        commission || existingRow.GroupB.commission.formula;

      existingRow.GroupB.defectiveReturn.formula =
        defectiveReturn || existingRow.GroupB.defectiveReturn.formula;

      existingRow.GroupB.otherVariableCost.formula =
        otherVariableCost || existingRow.GroupB.otherVariableCost.formula;

      ////-----------------------------Required ------------------------

      // formula's of these fields are clear yet

      // console.log("target value is ", existingRow.GroupA.targetDN);

      // existingRow.GroupB.shippingFreigt.value = parseFloat(
      //   (existingRow.GroupA.targetDN * 0.0675).toFixed(2)
      // );

      // existingRow.GroupB.duty.value = parseFloat(
      //   (existingRow.GroupA.targetDN * 0.0675).toFixed(2)
      // );

      // existingRow.GroupB.landedCost.value = parseFloat(
      //   (existingRow.GroupA.targetDN * 0.0675).toFixed(2)
      // );

      ////-----------------------------Required ------------------------

      existingRow.GroupB.outbound.value = parseFloat(
        (existingRow.GroupA.targetDN * 0.0675).toFixed(2)
      );

      existingRow.GroupB.commission.value = parseFloat(
        (existingRow.GroupA.targetDN * 0.0981).toFixed(2)
      );

      existingRow.GroupB.defectiveReturn.value = parseFloat(
        (existingRow.GroupA.targetDN * 0.0149).toFixed(2)
      );

      existingRow.GroupB.otherVariableCost.value = parseFloat(
        (existingRow.GroupA.targetDN * 0.0325).toFixed(2)
      );

      await existingRow.save();
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

//-----------------------------------------------delete------------------------------------------

const deleteRow = async (req, res) => {
  try {
    const { rowID } = req.body;

    console.log(rowID);

    const userID = await verifyToken(req.headers.authorization);
    const userGroup = await getUserGroup(userID);
    console.log("user is ", userID);
    const row = await TestRow.findById(rowID);
    console.log(row);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Row not found with this ID",
        data: null
      });
    }

    // console.log("row GroupA userID is ", row.GroupA.userID);
    // console.log("row GroupA userID type is ", typeof row.GroupA.userID);
    // console.log("current userID is ", userID);
    // console.log("current userID type is ", typeof userID);
    if (
      row.GroupA.userID.toString() !== userID.toString() ||
      userGroup !== "Group A"
    ) {
      return res.status(401).json({
        success: false,
        message: "You don't have the privilage to Delete this Row",
        data: null
      });
    }

    // console.log("ADD ROW")

    const delRow = await TestRow.findByIdAndDelete(rowID);

    return res.status(200).json({
      success: true,
      message: "Row Deleted Successfully",
      deletedRow: delRow
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
  editRow,
  deleteRow
};

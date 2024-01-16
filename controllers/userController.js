var userModel = require('../models/userModel');
const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
var ObjectId = require('mongodb').ObjectID;
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const { sendEmail } = require('../helpers/sendEmail');
const { sendMessage } = require('../helpers/sendMessage');
const otpModel = require('../models/otpModel');
const Role = require('../models/Role');
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio") (accountSid, authToken);

const sendOtp = async (req, res) => {
  try {
    const { email, phoneno } = req.body;
    //Creating OTP for SMS
    var otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    console.log("otp : ", otp);

    if (email) {
      // Send OTP to email
      const emailSent = await sendEmail(req.body.email, 'OTP for registration', `Add This OTP ${otp} to register`);
      if (!emailSent) {
        return res.status(404).json({
          success: false,
          message: "Email Not Valid",
        });
      }
      // Insert into otpModel
      const otpEntry = new otpModel({
        otp: otp,
        email: email
      });
      await otpEntry.save();
    }

    if (phoneno) {
      console.log("length", req.body.phoneno.toString().length);
      var length = req.body.phoneno.toString().length;
      if (length < 6 || length > 12) {
        return res.status(422).json({
          success: false,
          message: "Number digits should be 6-12",
        });
      }
      // Sending OTP to upcoming user number for register verification
      const messageSent = await sendMessage(phoneno, `Add This OTP ${otp} to register`);
      if (!messageSent) {
        return res.status(404).json({
          success: false,
          message: "Number Not Valid",
        });
      }
      // Insert into otpModel
      const otpEntry = new otpModel({
        otp: otp,
        phoneno: phoneno
      });
      await otpEntry.save();
    }

    return res.status(200).json({
      success: true,
      message: "OTP has been sent.",
    });
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

const confirmOtp = async (req, res) => {
  try {
    console.log(req.body.otp);
    //Finding number with given otp
    otpModel.findOne({ otp: req.body.otp }).then(async (otpProfile) => {
      console.log("user", otpProfile);
      const updatedOtp = await otpModel.updateOne(
        { otp: req.body.otp },
        {
          $set: {
            otp: null,
          },
        }
      );
      //Find if any otp exists
      if (otpProfile) {
        res.status(200).send({
          success: true,
          otpProfile: otpProfile,
          message: "OTP Successful, User Can Register",
        });
      } else {
        //send fail response if otp doesn't exists

        res.status(404).send({
          success: false,
          message: "Invalid Otp",
        });
      }
    });
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

// const createUser = async (req, res) => {
//   try {
//     console.log("req.body is", req.body);
//     // console.log("test");
//     if (req?.body?.role === 'driver' && !req?.body?.companyId) {
//       throw ("Need CompanyId for this.")
//     }
//     //checking if user exists
//     const email = req.body.email.toLowerCase();
//     console.log("body email is ", email)
//     var phoneno = req.body.phoneno;
//     var ifuser;

//     console.log("if user when declared ", ifuser)
//     ifuser = await userModel.findOne({
//       $or: [
//        // { phoneno: phoneno},
//         {email: email}
//       ]
//     });

//     console.log("if user is " , ifuser)
//     if (ifuser) {
//       console.log(ifuser);
//       //he already exists
//       console.log("user exists.");
//       // if (req.body.role) {
//       if (ifuser.isDeleted == true) {
//         return res.status(200).send({
//           success: false,
//           message: "This User is Deleted.",
//           data: [],
//         });
//       } else {
//         return res.status(200).send({
//           success: false,
//           message: "User Already Exists."
//         });
//       }
//     } else {
//       //encrypting user password
//       const encryptedPassword = await bcrypt.hash(
//         req.body.password,
//         saltRounds
//       );
//       //saving user to DB
//       console.log("req.files: ", req.files);
//       var newUser;
//       // if (req.body.role) {
//       newUser = await new userModel({
//         firstname: req.body.firstname,
//         lastname: req.body.lastname,
//         email: email,
//         address: req.body.address,
//         //countrycode: req.body.countrycode,
//         phoneno: phoneno,
//         role: req.body.role,
//         // companyId: ifinvited ? ifinvited.companyId : null,
//         profilepic: req.files
//           ? req.files.length > 0
//             ? "/src/" + req.files[0].filename
//             : null
//           : null,
//         password: encryptedPassword,
//         companyId: req?.body?.companyId
//       }).save();
//       if (newUser) {
//         console.log("You are now user", newUser);
//         res.status(200).send({
//           success: true,
//           message: "You are now user",
//           data: newUser,
//         });
//       } else {
//         console.log("Request Failed");
//         res.status(404).send({
//           success: false,
//           message: "Request Failed",
//         });
//       }
//     }
//   } catch (err) {
//     console.log("err.isJoi: ", err);
//     if (err.isJoi) {
//       res.status(422).json({
//         success: false,
//         message: err.details[0].message,
//       });
//     } else {
//       res.status(500).json({
//         success: false,
//         message: err,
//       });
//     }
//   }
// };

const createUserByUpperManagement = async (req, res) => {
  try {
    console.log("req.body is", req.body);
    const userInfo = await userModel.findOne({ _id: req.userId }).populate('role');
    if (userInfo?.role.roleName == "Upper Management") {
      const email = req.body.email.toLowerCase();
      // var phoneno = req.body.phoneno;
      var ifuser;
      ifuser = await userModel.findOne({
        $or: [
          { email: email }
        ]
      });
      if (ifuser) {
        console.log(ifuser);
        //he already exists
        console.log("user exists.");
        // if (req.body.role) {
        if (ifuser.isDeleted == true) {
          return res.status(200).send({
            success: false,
            message: "This User is Deleted.",
            data: [],
          });
        } else {

          return res.status(200).send({
            success: false,
            message: "User Already Exists."
          });
        }
      } else {
        //encrypting user password
        const encryptedPassword = await bcrypt.hash(
          req.body.password,
          saltRounds
        );
        //saving user to DB
        console.log("req.files: ", req.files);
        var newUser;
        // if (req.body.role) {
        newUser = await new userModel({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: email,
          address: req.body.address,
          //countrycode: req.body.countrycode,
          // phoneno: phoneno,
          role: req.body.role,
          // companyId: ifinvited ? ifinvited.companyId : null,
          profilepic: req.files
            ? req.files.length > 0
              ? "/src/" + req.files[0].filename
              : null
            : null,
          password: encryptedPassword,
          companyId: req?.body?.companyId
        }).save();
        if (newUser) {
          console.log("You are now user", newUser);
          res.status(200).send({
            success: true,
            message: "You are now user",
            data: newUser,
          });
        } else {
          console.log("Request Failed");
          res.status(404).send({
            success: false,
            message: "Request Failed",
          });
        }
      }
    } else {
      return res.status(400).send({
        success: false,
        message: "Only Upper Management can add users."
      });
    }

  } catch (err) {
    console.log("err.isJoi: ", err);
    if (err.isJoi) {
      res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: err,
      });
    }
  }
};

const login = async (req, res) => {
  try {
    console.log("req.body: ", req.body)
    const { email, phoneno, password } = req.body;
    console.log("phoneno: ", phoneno, "password: ", password)
    // email = email.toLowerCase();
    const user = await userModel.findOne({
      $or: [
        //{ phoneno: phoneno },
        { email: email }
      ]
    });
    if (user) {
      if (user.isDeleted == true) {
        return res.send(400).json({
          success: false,
          message: 'User not exists'
        });
      }
      // const passworddoc = await passwordModel.findOne({ user: user._id })
      // console.log(user, passworddoc)
      if (await bcrypt.compare(password, user.password)) {
        const accessToken = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '2d'
        });
        return res.status(200).json({
          success: true,
          message: 'Correct Details',
          user: user,
          accessToken: accessToken
        })
      } else {
        return res.status(400).json({
          success: false,
          message: 'Error: Email and Pass Dont Match'
        })

      }
    } else {
      console.log("Invalid User");
      return res.status(400).json({
        success: false,
        message: 'User not exists'
      });
    }
  } catch (err) {
    console.log("err.isJoi: ", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    console.log("U are ", req.body);
    const { email, phoneno } = req.body;
    if (email) {
      userModel
        .findOne({
          email: req.body.email,
        })
        .then(async (user) => {
          console.log("user", user);
          //Checking If User Exists
          if (!user) {
            return res.status(404).json({
              success: false,
              message: "User not found with this Email!",
            });
          }
          //Creating Reset OTP for SMS
          var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
          });

          const number = req.body.phoneno;
          console.log("numberrr: ", number);

          //Sending Reset OTP to email
          const emailSent = await sendEmail(req.body.email, 'Reset Password', `Reset Password OTP: ${otp}`);

          if (!emailSent) {
            return console.log("error occurs");
          }


          user.resetPasswordOtp = otp;
          return user.save();
        })
        .then((result) => {
          return res.status(200).send({
            success: true,
            message: "Reset Password Email sent",
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else if (phoneno) {
      userModel
        .findOne({
          phoneno: req.body.phoneno,
        })
        .then(async (user) => {
          console.log("user", user);
          //Checking If User Exists
          if (!user) {
            return res.status(404).json({
              success: false,
              message: "User not found with this Email!",
            });
          }
          //Creating Reset OTP for SMS
          var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
          });

          const number = req.body.phoneno;
          console.log("numberrr: ", number);

          //Sending Reset OTP to phone
          const messageSent = await sendMessage(number, `Reset Password OTP: ${otp}`);

          if (!messageSent) {
            return console.log("error occurs");
          }

          user.resetPasswordOtp = otp;
          return user.save();
        })
        .then((result) => {
          return res.status(200).send({
            success: true,
            message: "Reset Password message sent",
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }

  } catch (err) {
    console.log("err.isJoi: ", err);
    if (err.isJoi) {
      res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

const verifyOTP = async (req, res) => {
  try {
    console.log("U are ", req.body);
    //Finding user with the reset OTP
    userModel
      .findOne({ resetPasswordOtp: req.body.resetPasswordOtp })
      .then((user) => {
        //If User don't exist with the given resetOTP, give error
        console.log("user ", user)
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Invalid OTP",
          });
        } else {
          //If User exists with the given resetOTP then send success
          return res.status(200).json({
            success: true,
            user: user,
            message: "OTP Verified. User Can Change The Password",
          });
        }
      });
  } catch (err) {
    console.log(err);
    if (err.isJoi) {
      res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log("req.body", req.body);
    try {
      //Encrypting new password
      let encryptedPassword = await bcrypt.hash(req.body.password, saltRounds);
      console.log("encryptedPassword: ", encryptedPassword);
      //Updating password
      const updatePassword = await userModel.updateOne(
        { resetPasswordOtp: req.body.otp },
        {
          $set: {
            resetPasswordOtp: null,
            password: encryptedPassword
          },
        }
      );
      console.log("updatePassword: ", updatePassword);
      if (updatePassword?.nModified > 0)
        return res.status(200).json({
          success: true,
          message: "Password Updated",
        });
      else
        return res.status(401).json({
          success: false,
          message: "Otp not valid",
        });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  } catch (err) {
    console.log("err.isJoi: ", err);
    if (err.isJoi) {
      res.status(422).json({
        success: false,
        message: err.details[0].message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    return res.status(200).json({
      success: true,
      roles: roles,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  sendOtp,
  confirmOtp,
  // createUser,
  login,
  forgetPassword,
  verifyOTP,
  resetPassword,
  getRoles,
  createUserByUpperManagement
};

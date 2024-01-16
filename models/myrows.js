const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rowSchema = new Schema(
  {
    GroupA: {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      },
      targetDN: {
        type: String,
        default: ""
      },
      outsource: {
        type: String,
        default: null
      },
      dmRatio: {
        type: Number,
        default: null
      },
      nonPalletized40HQQty: {
        type: Number,
        default: null
      }
    },
    GroupB: {
      userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      },
      shippingFreigt: {
        value: {
          type: String,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      },
      duty: {
        value: {
          type: String,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      },
      landedCost: {
        value: {
          type: String,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      }
      // ... (other fields)
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("TestRow", rowSchema);

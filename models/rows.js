const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rowSchema = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    targetDN: {
      type: String,
      default: null
    },
    outsource: {
      type: String,
      default: null
    },
    dmRatio: {
      type: String,
      default: null
    },
    nonPalletized40HQQty: {
      type: String,
      default: null
    },
    shippingFreigt: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    duty: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    landedCost: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    outBound: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    commission: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    defectiveReturn: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    },
    otherVariableCost: {
      type: {
        value: String,
        formula: {
          type: String,
          default: "sdfds"
        }
      }
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Row", rowSchema);

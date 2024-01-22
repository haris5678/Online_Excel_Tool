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
        type: Number,
        default: ""
      },
      outsource: {
        type: Number,
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
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      },
      duty: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      },
      landedCost: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "sdfds"
        }
      },

      outbound: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "(Target DN) * 6.75%"
        }
      },

      commission: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "(Target DN) * 9.81%"
        }
      },

      defectiveReturn: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "(Target DN) * 1.49%"
        }
      },

      otherVariableCost: {
        value: {
          type: Number,
          default: ""
        },
        formula: {
          type: String,
          default: "(Target DN) * 3.25%"
        }
      }

      // ... (other fields)
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("TestRow", rowSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sheetSchema = new Schema(

  {
    sheetName:{
        type:String,
    },
    
    sheetRows:[{
        type: Schema.Types.ObjectId,
        ref: 'Row',
    }],

  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Sheet", sheetSchema);

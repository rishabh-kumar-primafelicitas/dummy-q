import { model, Schema } from "mongoose";

const tentSchema = new Schema(
  {
    tentName: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },
    tentType: {
      type: Schema.Types.ObjectId,
      ref: "TentType",
      required: true,
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },
    visibility: {
      type: Schema.Types.ObjectId,
      ref: "Visibility",
      required: true,
    },
  },
  { timestamps: true }
);

const Tent = model("Tent", tentSchema);
export default Tent;

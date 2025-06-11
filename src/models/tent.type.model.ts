import { model, Schema } from "mongoose";

const tentTypeSchema = new Schema(
  {
    tentType: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const QuestType = model("TentType", tentTypeSchema);
export default QuestType;

import { model, Schema } from "mongoose";

const questTypeSchema = new Schema(
  {
    appType: {
      type: String,
      required: true,
    },
    tentType: {
      type: String,
      required: true,
    },
    mutationType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const QuestType = model("QuestType", questTypeSchema);
export default QuestType;

import { model, Schema } from "mongoose";

const questSchema = new Schema(
  {
    tentId: {
      type: Schema.Types.ObjectId,
      ref: "Tent",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    xpValue: {
      type: Number,
      required: true,
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },
    scheduledAt: {
      type: Date,
    },
    prerequisites: {
      type: [Schema.Types.ObjectId],
      ref: "Quest",
    },
    rewardType: {
      type: Schema.Types.ObjectId,
      ref: "RewardType",
      required: true,
    },
    rewardValue: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Quest = model("Quest", questSchema);
export default Quest;

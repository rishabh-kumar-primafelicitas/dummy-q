import { model, Schema } from "mongoose";

const rewardTypeSchema = new Schema(
  {
    rewardType: {
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

const RewardTypeModal = model("RewardType", rewardTypeSchema);
export default RewardTypeModal;

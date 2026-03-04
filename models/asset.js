import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "video", "audio"]
    },
    url: {
      type: String,
      required: true
    },
    visibility: {
      type: String,
      default: "public",
      enum: ["public", "private"]
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes optimize search queries for the user's dashboard and public feed
assetSchema.index({ creator: 1 });
assetSchema.index({ visibility: 1 });

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
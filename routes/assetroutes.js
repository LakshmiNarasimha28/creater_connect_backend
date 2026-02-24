import { createAsset, getMyAssets, getPublicAssets, updateAsset, deleteAsset } from "../controllers/assetcontrollers.js";
import protect from "../middleware/authmiddleware.js";
import express from "express";
import upload from "../middleware/uploadmiddleware.js";

const assetrouter = express.Router();

assetrouter.post("/", protect, upload.single("file"), createAsset);
assetrouter.put("/:id", protect, updateAsset);
assetrouter.delete("/:id", protect, deleteAsset);
assetrouter.get("/my", protect, getMyAssets); 
assetrouter.get("/", getPublicAssets);

export default assetrouter;

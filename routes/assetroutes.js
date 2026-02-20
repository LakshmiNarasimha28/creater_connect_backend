import { getAssets, createAsset, getAssetById, updateAsset, deleteAsset } from "../controllers/assetcontrollers.js";

const assetRoutes = (app) => {
    app.post("/api/assets", createAsset);
    app.get("/api/assets", getAssets);
    app.get("/api/assets/:id", getAssetById);
    app.put("/api/assets/:id", updateAsset);
    app.delete("/api/assets/:id", deleteAsset);
};

export default assetRoutes;

import { getAssets as getAssetsService, createAsset as createAssetService, getAssetById as getAssetByIdService, updateAsset as updateAssetService, deleteAsset as deleteAssetService } from "../services/assetservices.js";

export const getAssets = async (req, res) => {
    try {
        const assets = await getAssetsService();
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createAsset = async (req, res) => {
    try {
        const savedAsset = await createAssetService(req.file, req.body, req.user._id);
        res.status(201).json(savedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAssetById = async (req, res) => {
    try {
        const asset = await getAssetByIdService(req.params.id);
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const updatedAsset = await updateAssetService(req.params.id, req.body);
        res.json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        await deleteAssetService(req.params.id);
        res.json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

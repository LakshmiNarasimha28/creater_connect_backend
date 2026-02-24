import { createAssetService, getMyAssetsService, getPublicAssetsService, updateAssetService, deleteAssetService } from "../services/assetservices.js";

export const getPublicAssets = async (req, res) => {
    try {
        const assets = await getPublicAssetsService(req.query);
        res.json(assets);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const createAsset = async (req, res) => {
    try {
        const savedAsset = await createAssetService(req.file, req.body, req.user._id);
        res.status(201).json(savedAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyAssets = async (req, res) => {
    try {
        const assets = await getMyAssetsService(req.user._id, req.query);
        res.json(assets);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const updatedAsset = await updateAssetService(req.params.id, req.body, req.user._id);
        res.json(updatedAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        await deleteAssetService(req.params.id, req.user._id);
        res.json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

import { createAssetService, getMyAssetsService, getPublicAssetsService, updateAssetService, deleteAssetService } from "../services/assetservices.js";
import { getIo } from "../socket/socket.js";

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
        const populatedAsset = await savedAsset.populate("creator", "name email");

        if (populatedAsset.visibility === "public") {
            try {
                const io = getIo();
                io.emit("asset-created", populatedAsset);
            } catch (socketError) {
                console.error("Failed to emit asset-created event:", socketError.message);
            }
        }

        res.status(201).json({ asset: populatedAsset });
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
        const populatedAsset = await updatedAsset.populate("creator", "name email");

        try {
            const io = getIo();
            io.emit("asset-updated", populatedAsset);
        } catch (socketError) {
            console.error("Failed to emit asset-updated event:", socketError.message);
        }

        res.json({ asset: populatedAsset });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const assetId = req.params.id;
        await deleteAssetService(assetId, req.user._id);

        try {
            const io = getIo();
            io.emit("asset-deleted", { assetId });
        } catch (socketError) {
            console.error("Failed to emit asset-deleted event:", socketError.message);
        }

        res.json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

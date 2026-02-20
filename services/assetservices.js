import Assets from "../models/asset.js";

export const getAssets = async (req, res) => {
  try {
    const assets = await Assets.find().populate("creator", "username");
    res.json(assets);
    } catch (error) {
    res.status(500).json({ message: "Server error" });
    }
};

export const createAsset = async (file, body, userId) => {
    if (!file) {
        throw new Error("No file uploaded");
    }
    const uploadresult = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    const { title, description, type, visibility } = body;
    const newAsset = new Assets({
        title,
        description,
        type,
        url: uploadresult,
        visibility,
        creator: userId
    });
    try {
        const savedAsset = await newAsset.save();
        return savedAsset;
    } catch (error) {
        throw new Error("Error saving asset: " + error.message);
    }
};

export const getAssetById = async (req, res) => {
    try {
        const asset = await Assets.findById(req.params.id).populate("creator", "username");
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateAsset = async (req, res) => {
    const { title, description, type, url, visibility } = req.body;
    try {
        const asset = await Assets.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        if (asset.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        asset.title = title || asset.title;
        asset.description = description || asset.description;
        asset.type = type || asset.type;
        asset.url = url || asset.url;
        asset.visibility = visibility || asset.visibility;
        const updatedAsset = await asset.save();
        res.json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }   
};

export const deleteAsset = async (req, res) => {
    try {
        const asset = await Assets.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        if (asset.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        await asset.remove();
        res.json({ message: "Asset deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


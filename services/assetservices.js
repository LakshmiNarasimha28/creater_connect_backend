import Assets from "../models/asset.js";
import cloudinary from "../config/cloudinary.js";

export const getMyAssetsService = async (userId, query) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = query.search || "";

    const filter = {
        creator: userId,
        ...(search && { title: { $regex: search, $options: "i" } })
    };

    const assets = await Assets.find(filter)
        .populate("creator", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    const total = await Assets.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return { assets, total, page, totalPages, hasMore: page < totalPages };
};

export const getPublicAssetsService = async (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = query.search || "";
    const type = query.type; // Filter by asset type (image, video, audio)

    const filter = {
        visibility: "public",
        ...(search && { title: { $regex: search, $options: "i" } }),
        ...(type && ["image", "video", "audio"].includes(type) && { type })
    };

    const assets = await Assets.find(filter)
        .populate("creator", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    const total = await Assets.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return { assets, total, page, totalPages, hasMore: page < totalPages };
};

export const createAssetService = async (file, body, userId) => {
    if (!file) {
        throw new Error("No file uploaded");
    }

    if (!userId) {
        throw new Error("User authentication required");
    }

    const { title, description, type, visibility } = body;

    // Validate required fields
    if (!title || !title.trim()) {
        throw new Error("Title is required");
    }

    if (!type || !["image", "video", "audio"].includes(type)) {
        throw new Error("Valid asset type is required (image, video, or audio)");
    }

    if (visibility && !["public", "private"].includes(visibility)) {
        throw new Error("Invalid visibility value");
    }

    let uploadResult;
    try {
        // Upload to Cloudinary
        uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: "creator_connect_assets",
            resource_type: "auto",
            timeout: 60000
        });
    } catch (error) {
        throw new Error("Failed to upload file to cloud storage: " + error.message);
    }

    // Create asset document
    const newAsset = new Assets({
        title: title.trim(),
        description: description?.trim() || "",
        type,
        url: uploadResult.secure_url,
        visibility: visibility || "public",
        creator: userId
    });

    try {
        const savedAsset = await newAsset.save();
        return savedAsset;
    } catch (error) {
        // Cleanup cloudinary upload if database save fails
        try {
            await cloudinary.uploader.destroy(uploadResult.public_id);
        } catch (cleanupError) {
            console.error("Failed to cleanup cloudinary upload:", cleanupError);
        }
        throw new Error("Error saving asset: " + error.message);
    }
};

export const updateAssetService = async (assetId, updates, userId) => {
    if (!assetId) {
        throw new Error("Asset ID is required");
    }

    if (!userId) {
        throw new Error("User authentication required");
    }

    const asset = await Assets.findById(assetId);
    if (!asset) {
        throw new Error("Asset not found");
    }

    // Verify ownership
    if (asset.creator.toString() !== userId.toString()) {
        throw new Error("You are not authorized to update this asset");
    }

    const { title, description, type, visibility } = updates;

    // Validate updates
    if (title !== undefined) {
        if (!title.trim()) {
            throw new Error("Title cannot be empty");
        }
        asset.title = title.trim();
    }

    if (description !== undefined) {
        asset.description = description.trim();
    }

    if (type !== undefined) {
        if (!["image", "video", "audio"].includes(type)) {
            throw new Error("Invalid asset type");
        }
        asset.type = type;
    }

    if (visibility !== undefined) {
        if (!["public", "private"].includes(visibility)) {
            throw new Error("Invalid visibility value");
        }
        asset.visibility = visibility;
    }

    const updatedAsset = await asset.save();
    return updatedAsset;
};

export const deleteAssetService = async (assetId, userId) => {
    if (!assetId) {
        throw new Error("Asset ID is required");
    }

    if (!userId) {
        throw new Error("User authentication required");
    }

    const asset = await Assets.findById(assetId);
    if (!asset) {
        throw new Error("Asset not found");
    }

    // Verify ownership
    if (asset.creator.toString() !== userId.toString()) {
        throw new Error("You are not authorized to delete this asset");
    }

    // Extract public_id from cloudinary URL for deletion
    try {
        const urlParts = asset.url.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExt.split('.')[0];

        // Delete from cloudinary
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Failed to delete file from cloudinary:", error.message);
        // Continue with database deletion even if cloudinary deletion fails
    }

    // Delete from database
    await asset.deleteOne();
    return true;
};


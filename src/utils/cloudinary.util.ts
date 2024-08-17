import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import fs from "fs";
import { ApiError } from "./errorHandling.util.js";

// configuration
cloudinary.config({
  cloud_name: "dqpnkwk97",
  api_key: "852461792895258",
  api_secret: "b_lflbpRWgSeeqBZ0U-9jifsCic",
});

// does: upload the file on cloudinary cloud
export const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) {
      console.error("Cloudinary upload failed: No file path provided!");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("Cloudinary upload failed error:", error);
    throw new ApiError(500, "Cloudinary upload failed error");
  }
};

// does: delete the file on cloudinary
export const deleteOnCloudinary = async (
  cloudinaryUrl: string
): Promise<void> => {
  try {
    if (!cloudinaryUrl) {
      throw new ApiError(400, "Couldn't find out cloudinary URL");
    }

    const cloudinaryUrlPublicId = getPublicIdFromUrl(cloudinaryUrl);
    const response = await cloudinary.uploader.destroy(cloudinaryUrlPublicId);
    console.log(response);
  } catch (error) {
    console.log("Couldn't able to delete previous cloudinary image", error);
    throw new ApiError(
      400,
      "Couldn't able to delete previous cloudinary image"
    );
  }
};

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  const publicId = fileName?.split(".")[0]; // Remove file extension
  return publicId || "";
};

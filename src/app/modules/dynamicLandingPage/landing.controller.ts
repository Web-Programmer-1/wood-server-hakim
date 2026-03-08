import { Request, Response } from "express";
import { LandingService } from "./landing.service";
import { deleteFileFromS3 } from "../../../utils/s3CleanUp";
import { MulterS3File } from "../../types/multer";

const createHeroSlide = async (req: Request, res: Response) => {
  const uploadedFiles: string[] = [];

  try {
    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

    
    if (!files || !files['logo'] || !files['image'] || !files['video']) {
      

      if (files?.['logo']) await deleteFileFromS3(files['logo'][0].location);
      if (files?.['image']) await deleteFileFromS3(files['image'][0].location);
      if (files?.['video']) await deleteFileFromS3(files['video'][0].location);

      return res.status(400).json({ 
        success: false, 
        message: "Missing files! Required: 'logo', 'image', and 'video'." 
      });
    }

    const logoUrl = files['logo'][0].location;
    const imageUrl = files['image'][0].location;
    const videoUrl = files['video'][0].location;

    uploadedFiles.push(logoUrl, imageUrl, videoUrl);

    const payload = {
      ...req.body,
      logoImage: logoUrl,
      imageUrl: imageUrl,
      videoUrl: videoUrl,
    };


    const result = await LandingService.createHeroSlide(payload);

    res.status(200).json({
      success: true,
      message: "Hero slide created successfully",
      data: result,
    });

  } catch (error: any) {
    console.error("❌ Error creating slide. Rolling back S3 files...");
  
    await Promise.all(uploadedFiles.map(url => deleteFileFromS3(url)));

    res.status(400).json({ 
      success: false,
      message: error.message || "Failed to create hero slide",
    });
  }
};

// Get & Delete controllers...
const getHeroSlides = async (req: Request, res: Response) => {
  try {
    const result = await LandingService.getHeroSlides();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteHeroSlide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await LandingService.deleteHeroSlide(id);
    res.status(200).json({ success: true, message: "Deleted successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};








// ====================  Company Logo Controllers ==================== //




const createCompanyLogo = async (req: Request, res: Response) => {
  let uploadedFileUrl = "";

  try {
    const file = req.file as any;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload a company logo" 
      });
    }

    uploadedFileUrl = file.location;

    
    const result = await LandingService.createCompanyLogo(uploadedFileUrl);

    res.status(200).json({
      success: true,
      message: "Company logo added successfully",
      data: result,
    });

  } catch (error: any) {
 
    console.error("❌ Error adding company logo. Rolling back...");
    if (uploadedFileUrl) {
      await deleteFileFromS3(uploadedFileUrl);
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add logo",
    });
  }
};

const getAllCompanyLogos = async (req: Request, res: Response) => {
  try {
    const result = await LandingService.getAllCompanyLogos();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompanyLogo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await LandingService.deleteCompanyLogo(id);
    res.status(200).json({ success: true, message: "Logo deleted successfully", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// =================== Footer Controllers ==================== //




const getFooter = async (_req: Request, res: Response) => {
  const result = await LandingService.getFooterFromDB();

  res.status(200).json({
    success: true,
    data: result,
  });
};

const upsertFooter = async (req: Request, res: Response) => {
  try {
    const { description, email, phone } = req.body;

    const logoUrl = req.file
      ? (req.file as any).location
      : "";

    const result = await LandingService.upsertFooterIntoDB({
      logoUrl,
      description,
      email,
      phone,
    });

    res.status(200).json({
      success: true,
      message: "Footer saved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Footer save failed",
    });
  }
};


const deleteFooter = async (req: Request, res: Response) => {
  const { id } = req.params;

  await LandingService.softDeleteFooterFromDB(id);

  res.status(200).json({
    success: true,
    message: "Footer deleted successfully",
  });
};

/* ================= OFFICE ================= */

const createOffice = async (req: Request, res: Response) => {
  const result = await LandingService.createOfficeIntoDB(req.body);

  res.status(201).json({
    success: true,
    message: "Office created successfully",
    data: result,
  });
};

const getOffices = async (_req: Request, res: Response) => {
  const result = await LandingService.getOfficesFromDB();

  res.status(200).json({
    success: true,
    data: result,
  });
};

const updateOffice = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await LandingService.updateOfficeIntoDB(id, req.body);

  res.status(200).json({
    success: true,
    message: "Office updated successfully",
    data: result,
  });
};

const deleteOffice = async (req: Request, res: Response) => {
  const { id } = req.params;

  await LandingService.softDeleteOfficeFromDB(id);

  res.status(200).json({
    success: true,
    message: "Office deleted successfully",
  });
};




const updateFooter = async (req: Request, res: Response) => {
  try {
    const { description, email, phone } = req.body;

    const logoUrl = req.file
      ? (req.file as any).location
      : undefined;

    const result = await LandingService.updateFooterIntoDB({
      logoUrl,
      description,
      email,
      phone,
    });

    res.status(200).json({
      success: true,
      message: "Footer updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Footer update failed",
    });
  }
};



const createMegaOffer = async (req: Request, res: Response) => {
  try {
    const file = req.file as any;

    if (!file?.location) {
      return res.status(400).json({ message: "Image is required" });
    }

    const offer = await LandingService.createMegaOffer(file.location);

    res.status(201).json({
      message: "Mega offer created successfully",
      data: offer,
    });
  } catch (error: any) {
    if (error.message.includes("limit")) {
      return res.status(409).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create mega offer",
    });
  }
};


const getMegaOffers = async (_req: Request, res: Response) => {
  const offers = await LandingService.getMegaOffers();
  res.status(200).json({
    message: "Mega offers fetched successfully",
    data: offers,
  });
};


const deleteMegaOffer = async (req: Request, res: Response) => {
  const { id } = req.params;

  await LandingService.deleteMegaOffer(id);

  res.status(204).json({
    message: "Mega offer deleted successfully",
  });
};

const updateMegaOffer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file as any;

  if (!file?.location) {
    return res.status(400).json({ message: "Image is required" });
  }

  const updatedOffer = await LandingService.updateMegaOffer(
    id,
    file.location
  );

  res.status(200).json({
    message: "Mega offer updated successfully",
    data: updatedOffer,
  });
};






// ================== GalleryImage Api ================== //




const createGalleryImages = async (req: Request, res: Response) => {
  const files = req.files as Express.MulterS3.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  const imageUrls = files.map(file => file.location);

  const images = await LandingService.createGalleryImages(imageUrls);

  res.status(201).json({
    message: "Gallery images created successfully",
    data: images,
  });
};


const getGalleryImages = async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 9;

  const result = await LandingService.getGalleryImages(search, page, limit);

  res.status(200).json({
    message: "Gallery images fetched successfully",
    meta: result.meta,
    data: result.data,
  });
};

const deleteGalleryImage = async (req: Request, res: Response) => {
  await LandingService.deleteGalleryImage(req.params.id);
  res.status(204).send({
    message: "Gallery image deleted successfully",
    data: null,
  });
};



// ================= Landing Videos Api ================= //



const createLandingVideo = async (req: Request, res: Response) => {
  const uploadedFiles: string[] = [];

  try {
    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

    const { title, sourceType, youtubeUrl } = req.body;

    if (!title || !sourceType) {
      return res.status(400).json({
        success: false,
        message: "title and sourceType are required",
      });
    }

    // thumbnail is always required
    if (!files || !files["thumbnail"]) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail is required",
      });
    }

    const thumbnailUrl = files["thumbnail"][0].location;
    uploadedFiles.push(thumbnailUrl);

    let videoFileUrl: string | undefined;

    // 🔹 SOURCE BASED VALIDATION (same mindset as hero)
    if (sourceType === "YOUTUBE") {
      if (!youtubeUrl) {
        await deleteFileFromS3(thumbnailUrl);

        return res.status(400).json({
          success: false,
          message: "YouTube URL is required for YOUTUBE source",
        });
      }
    }

    if (sourceType === "UPLOAD") {
      if (!files["video"]) {
        await deleteFileFromS3(thumbnailUrl);

        return res.status(400).json({
          success: false,
          message: "Video file is required for UPLOAD source",
        });
      }

      videoFileUrl = files["video"][0].location;
      uploadedFiles.push(videoFileUrl);
    }

    const payload = {
      title,
      sourceType,
      thumbnailUrl,
      youtubeUrl: sourceType === "YOUTUBE" ? youtubeUrl : undefined,
      videoUrl: sourceType === "UPLOAD" ? videoFileUrl : undefined,
    };

    const result = await LandingService.createLandingVideo(payload);

    res.status(201).json({
      success: true,
      message: "Landing video created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error creating landing video. Rolling back S3 files...");

    await Promise.all(uploadedFiles.map((url) => deleteFileFromS3(url)));

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create landing video",
    });
  }
};


const getLandingVideos = async (_req: Request, res: Response) => {
  const videos = await LandingService.getLandingVideos();
  res.status(200).json(videos);
};

const updateLandingVideo = async (req: Request, res: Response) => {
  const uploadedFiles: string[] = [];

  try {
    const { id } = req.params;
    const { title, sourceType, youtubeUrl, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Landing video id is required" });
    }

    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

    const newThumbnail = files?.thumbnail?.[0];
    const newVideo = files?.video?.[0];

    if (newThumbnail?.location) uploadedFiles.push(newThumbnail.location);
    if (newVideo?.location) uploadedFiles.push(newVideo.location);

    /**
     * 🔹 Source based minimal validation
     */
    if (sourceType === "YOUTUBE" && newVideo) {
      await Promise.all(uploadedFiles.map(deleteFileFromS3));
      return res.status(400).json({
        message: "Video upload not allowed for YOUTUBE source",
      });
    }

    if (sourceType === "UPLOAD" && youtubeUrl) {
      await Promise.all(uploadedFiles.map(deleteFileFromS3));
      return res.status(400).json({
        message: "YouTube URL not allowed for UPLOAD source",
      });
    }

    const payload: any = {
      title,
      sourceType,
      youtubeUrl: sourceType === "YOUTUBE" ? youtubeUrl : undefined,
      videoUrl: sourceType === "UPLOAD" ? newVideo?.location : undefined,
      thumbnailUrl: newThumbnail?.location,
      isActive,
    };

    // remove undefined keys (clean update)
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const updated = await LandingService.updateLandingVideo(id, payload);

    res.status(200).json({
      success: true,
      message: "Landing video updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("❌ Error updating landing video. Rolling back uploads...");

    await Promise.all(uploadedFiles.map(deleteFileFromS3));

    res.status(400).json({
      success: false,
      message: error.message || "Failed to update landing video",
    });
  }
};


const deleteLandingVideo = async (req: Request, res: Response) => {
  await LandingService.deleteLandingVideo(req.params.id);
  res.status(204).json({
    message: "Landing video deleted successfully",
   
  });
};






export const LandingController = {
  createHeroSlide,
  getHeroSlides,
  deleteHeroSlide,
  createCompanyLogo,
  getAllCompanyLogos,
  deleteCompanyLogo,
  getFooter,
  upsertFooter,
  deleteFooter,
  createOffice,
  getOffices,
  updateOffice,
  deleteOffice,
  updateFooter,
  createMegaOffer,
  getMegaOffers,
  deleteMegaOffer,
  updateMegaOffer,
  createGalleryImages,
  getGalleryImages,
  deleteGalleryImage,
  createLandingVideo,
  getLandingVideos,
  updateLandingVideo,
  deleteLandingVideo,
};
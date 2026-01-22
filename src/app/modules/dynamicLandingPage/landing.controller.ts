import { Request, Response } from "express";
import { LandingService } from "./landing.service";
import { deleteFileFromS3 } from "../../../utils/s3CleanUp";

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
};
import { Request, Response } from "express";
import httpStatus from "http-status";
import { MachineService } from "./machine.service";



const getMachines = async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    categoryId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const result = await MachineService.getMachines({
    page: Number(page),
    limit: Number(limit),
    search: search as string | undefined,
    categoryId: categoryId as string | undefined,
    sortBy: sortBy as "createdAt" | "name",
    sortOrder: sortOrder as "asc" | "desc",
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
};






/**
 * Get all featured machines
 * @returns {Promise<Response>} A promise that resolves a response containing the featured machines
 */
const getFeaturedMachines = async (req: Request, res: Response) => {
  const result = await MachineService.getFeaturedMachines();
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const searchMachines = async (req: Request, res: Response) => {
  const { keyword } = req.query;
  const result = await MachineService.searchMachines(keyword as string);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const getMachineBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await MachineService.getMachineBySlug(slug);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const getRelatedMachines = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await MachineService.getRelatedMachines(slug);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};




const createMachine = async (req: Request, res: Response) => {
  const body = JSON.parse(req.body.data);

  const files = req.files as {
    thumbnail?: Express.MulterS3.File[];
    banner?: Express.MulterS3.File[];
  };

  const payload = {
    ...body,
    thumbnailImage: files?.thumbnail?.[0]?.location,
    bannerImage: files?.banner?.[0]?.location,
  };

  const result = await MachineService.createMachine(payload);
  
  console.log("CreateMachine", result)
  res.status(201).json({
    success: true,
    data: result,
  });
};











const updateMachine = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MachineService.updateMachine(id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const updateMachineStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MachineService.updateMachineStatus(id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const deleteMachine = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MachineService.deleteMachine(id);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Machine deleted successfully",
    data: result,
  });
};

const getAllMachineImages = async (req: Request, res: Response) => {
  const { page = "1", limit = "10", search } = req.query;

  const result = await MachineService.getAllMachineImages({
    page: Number(page),
    limit: Number(limit),
    search: search as string | undefined,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
};








const updateMachineImage = async (req: Request, res: Response) => {
  const { id } = req.params;

  const file = req.file as Express.MulterS3.File | undefined;
  const { isPrimary } = req.body;

  const payload: {
    url?: string;
    isPrimary?: boolean;
  } = {};

  // ✅ AWS S3 image URL
  if (file?.location) {
    payload.url = file.location;
  }

  // ✅ optional primary update
  if (isPrimary !== undefined) {
    payload.isPrimary = isPrimary === "true";
  }

  const result = await MachineService.updateMachineImage(id, payload);

  res.status(200).json({
    success: true,
    message: "Machine image updated successfully",
    data: result,
  });
};










const uploadMachineImages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as Express.MulterS3.File[];
  const result = await MachineService.uploadMachineImages(id, files);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};





const deleteMachineImage = async (req: Request, res: Response) => {
  const { id } = req.params; // ✅ id = imageId

  const result = await MachineService.deleteMachineImage(id);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Image deleted successfully",
    data: result,
  });
};




// machine video opearations 


const uploadMachineVideo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file as Express.MulterS3.File;
  const result = await MachineService.uploadMachineVideo(id, file);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};




const getAllMachineVideosController = async (req: Request, res: Response) => {
  const { page = "1", limit = "10" } = req.query;

  const result = await MachineService.getAllMachineVideos({
    page: Number(page),
    limit: Number(limit),
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
};




const updateMachineVideo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file as Express.MulterS3.File;

  const result = await MachineService.updateMachineVideo(id, file);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Machine video updated successfully",
    data: result,
  });
};



const deleteMachineVideo = async (req: Request, res: Response) => {
  const { id } = req.params;

  await MachineService.deleteMachineVideo(id);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Machine video deleted successfully",
  });
};







export const MachineController = {
  getMachines,
  getFeaturedMachines,
  searchMachines,
  getMachineBySlug,
  getRelatedMachines,
  createMachine,
  updateMachine,
  updateMachineStatus,
  deleteMachine,
  uploadMachineImages,
  uploadMachineVideo,
  deleteMachineImage,
  getAllMachineImages,
  updateMachineImage,
  getAllMachineVideosController,
  updateMachineVideo,
  deleteMachineVideo,
};

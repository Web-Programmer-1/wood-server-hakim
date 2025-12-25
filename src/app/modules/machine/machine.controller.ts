import { Request, Response } from "express";
import httpStatus from "http-status";
import { MachineService } from "./machine.service";

// const getMachines = async (req: Request, res: Response) => {
//   const result = await MachineService.getMachines();
//   res.status(httpStatus.OK).json({
//     success: true,
//     data: result,
//   });
// };


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

const uploadMachineImages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as Express.MulterS3.File[];
  const result = await MachineService.uploadMachineImages(id, files);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const uploadMachineVideo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file as Express.MulterS3.File;
  const result = await MachineService.uploadMachineVideo(id, file);
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

const deleteMachineImage = async (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  const result = await MachineService.deleteMachineImage(id, imageId);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Image deleted successfully",
    data: result,
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
};

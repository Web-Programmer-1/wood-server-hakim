import { Request, Response } from "express";
import * as MachineService from "./machine.service";


export const createMachine = async (req: Request, res: Response) => {
  const data = await MachineService.createMachineService(req.body);

  console.log("From Controller", data)
  res.status(201).json({
    success: true,
    message: "Machine created successfully",
    data,
  });
};

/* ================= LIST ================= */
export const getMachineList = async (req: Request, res: Response) => {
  const data = await MachineService.getMachineListService(req.query);
  res.json({
    success: true,
    message: "Machine list fetched",
    data,
  });
};

/* ================= SINGLE ================= */
export const getSingleMachine = async (req: Request, res: Response) => {
  const data = await MachineService.getSingleMachineService(req.params.id);
  res.json({
    success: true,
    message: "Machine details fetched",
    data,
  });
};

/* ================= UPDATE ================= */
// export const updateMachine = async (req: Request, res: Response) => {
//   const data = await MachineService.updateMachineService(
//     req.params.id,
//     req.body
//   );
//   res.json({
//     success: true,
//     message: "Machine updated successfully",
//     data,
//   });
// };




export const updateMachine = async (req: Request, res: Response) => {
  const result = await MachineService.updateMachineService(
    req.params.id,
    req.body
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};










/* ================= DELETE ================= */
export const deleteMachine = async (req: Request, res: Response) => {
  await MachineService.deleteMachineService(req.params.id);
  res.json({
    success: true,
    message: "Machine deleted successfully",
  });
};

/* ================= IMAGE ================= */
export const addMachineImage = async (req: Request, res: Response) => {
  const file = (req.files as any)?.image?.[0];
  const data = await MachineService.addMachineImageService(
    req.params.id,
    file.location
  );
  res.json({
    success: true,
    message: "Image added",
    data,
  });
};

export const deleteMachineImage = async (req: Request, res: Response) => {
  await MachineService.deleteMachineImageService(req.params.id);
  res.json({
    success: true,
    message: "Image deleted",
  });
};

/* ================= VIDEO ================= */
// export const addMachineVideo = async (req: Request, res: Response) => {
//   const data = await MachineService.addMachineVideoService(
//     req.params.id,
//     req.body.url
//   );
//   res.json({
//     success: true,
//     message: "Video added",
//     data,
//   });
// };



export const addMachineVideo = async (req: Request, res: Response) => {
  let videoUrl: string | undefined;

  // CASE 1: Video File Upload (S3)
  if (req.file) {
    videoUrl = (req.file as any).location;
  }

  // CASE 2: YouTube URL
  if (!videoUrl && req.body?.url) {
    videoUrl = req.body.url;
  }

  // ❌ No input
  if (!videoUrl) {
    return res.status(400).json({
      success: false,
      message: "Provide either a YouTube URL or upload a video file",
    });
  }

  const result = await MachineService.addMachineVideoService(
    req.params.id,
    videoUrl
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};




export const deleteMachineVideo = async (req: Request, res: Response) => {
  await MachineService.deleteMachineVideoService(req.params.id);
  res.json({
    success: true,
    message: "Video deleted",
  });
};

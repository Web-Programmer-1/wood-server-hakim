import { LandingVideoSource } from "@prisma/client";
import { prisma } from "../../shared/prisma";



const createHeroSlide = async (data: any) => {


  const existingSlide = await prisma.heroSection.findFirst({
    where:{
      title: data.title || null,


    }
  });

  if (existingSlide){
    throw new Error("A hero slide with the same title already exists.");
  };



  if (!data.title || typeof data.title !== "string" || data.title.trim().length < 3) {
    throw new Error("Title is required and must be at least 3 characters");
  }


  if (!data.logoImage || !data.imageUrl || !data.videoUrl) {
    throw new Error("System Error: Media URLs are missing in payload");
  }

  // 💾 Database Create
  const result = await prisma.heroSection.create({
    data: {
      title: data.title,
      subtitle: data.subtitle || null,
      buttonText: data.buttonText || null,
      
      logoImage: data.logoImage,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
    },
  });

  return result;
};

const getHeroSlides = async () => {
  return await prisma.heroSection.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

const deleteHeroSlide = async (id: string) => {
  
  return await prisma.heroSection.delete({ where: { id } });
};


// ====================  Company Logo Apis ==================== //



const createCompanyLogo = async (imageUrl: string) => {
  const result = await prisma.companyLogo.create({
    data: {
      imageUrl: imageUrl,
    },
  });
  return result;
};


const getAllCompanyLogos = async () => {
  return await prisma.companyLogo.findMany({
    orderBy: { createdAt: "desc" },
  });
};


const deleteCompanyLogo = async (id: string) => {
  return await prisma.companyLogo.delete({
    where: { id },
  });
};




//====================  Footer Section is started ==============================




const getFooterFromDB = async () => {
  return prisma.footer.findFirst({
    where: { isDeleted: false },
  });
};

const upsertFooterIntoDB = async (payload: {
  logoUrl: string;
  description: string;
  email: string;
  phone: string;
}) => {
  const { logoUrl, description, email, phone } = payload;



  if (!logoUrl) {
    throw new Error("Logo is required");
  }

  if (!description || description.trim().length < 10) {
    throw new Error("Description must be at least 10 characters long");
  }

  if (!email) {
    throw new Error("Email is required");
  }

  if (!phone) {
    throw new Error("Phone number is required");
  }

  /* ========= FORMAT VALIDATION ========= */

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }


  const phoneRegex = /^(\+?88)?01[3-9]\d{8}$|^\+?[1-9]\d{7,14}$/;
  if (!phoneRegex.test(phone)) {
    throw new Error("Invalid phone number");
  }



  const existingFooter = await prisma.footer.findFirst({
    where: { isDeleted: false },
  });

  if (existingFooter) {
    return prisma.footer.update({
      where: { id: existingFooter.id },
      data: {
        logoUrl,
        description,
        email,
        phone,
      },
    });
  }

  return prisma.footer.create({
    data: {
      logoUrl,
      description,
      email,
      phone,
    },
  });
};


const softDeleteFooterFromDB = async (id: string) => {
  return prisma.footer.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

/* ================= OFFICE ================= */

const createOfficeIntoDB = async (payload: {
  title: string;
  address: string;
  phone: string;
}) => {

  const count = await prisma.office.count({
    where: { isDeleted: false },
  });

  if (count >= 4) {
    throw new Error("Office limit reached (maximum 4 offices Card allowed)");
  }

  return prisma.office.create({
    data: payload,
  });
};


const getOfficesFromDB = async () => {
  return prisma.office.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "asc" },
  });
};

const updateOfficeIntoDB = async (
  id: string,
  payload: Partial<{
    title: string;
    address: string;
    phone: string;
  }>
) => {
  return prisma.office.update({
    where: { id },
    data: payload,
  });
};

const softDeleteOfficeFromDB = async (id: string) => {
  return prisma.office.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};




const updateFooterIntoDB = async (payload: {
  logoUrl?: string;
  description?: string;
  email?: string;
  phone?: string;
}) => {
  const { logoUrl, description, email, phone } = payload;

  const existingFooter = await prisma.footer.findFirst({
    where: { isDeleted: false },
  });

  if (!existingFooter) {
    throw new Error("Footer not found");
  }

  /* ========= VALIDATION ========= */

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
  }

  if (phone) {
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$|^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Invalid phone number");
    }
  }

  if (description && description.trim().length < 10) {
    throw new Error("Description must be at least 10 characters long");
  }

  /* ========= UPDATE ========= */

  return prisma.footer.update({
    where: { id: existingFooter.id },
    data: {
      ...(logoUrl && { logoUrl }),
      ...(description && { description }),
      ...(email && { email }),
      ...(phone && { phone }),
    },
  });
};



const createMegaOffer = async (imageUrl: string) => {
  if (!imageUrl) {
    throw new Error("Image is required");
  }


  const count = await prisma.megaOffer.count();

  if (count >= 3) {
    throw new Error("Mega offer limit reached (max 3 images allowed)");
  }

  return prisma.megaOffer.create({
    data: { imageUrl },
  });
};


const getMegaOffers = async () => {
  return prisma.megaOffer.findMany({
    orderBy: { createdAt: "asc" },
    take: 3, // only need 3 images
  });
};


const deleteMegaOffer = async (id: string) => {
  if (!id) {
    throw new Error("MegaOffer id is required");
  }

  return prisma.megaOffer.delete({
    where: { id },
  });
};


const updateMegaOffer = async (id: string, imageUrl?: string) => {
  if (!id) {
    throw new Error("MegaOffer id is required");
  }

  if (!imageUrl) {
    throw new Error("Image is required for update");
  }

  return prisma.megaOffer.update({
    where: { id },
    data: {
      imageUrl,
    },
  });
};



// ================== GalleryImage Api ================== //


const createGalleryImages = async (imageUrls: string[]) => {
  if (!imageUrls.length) {
    throw new Error("Image list cannot be empty");
  }

  const data = imageUrls.map(url => ({ imageUrl: url }));

  await prisma.galleryImage.createMany({
    data,
  });

  return prisma.galleryImage.findMany({
    orderBy: { createdAt: "desc" },
    take: imageUrls.length,
  });
};


const getGalleryImages = async (limit = 9) => {
  return prisma.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

const deleteGalleryImage = async (id: string) => {
  if (!id) throw new Error("GalleryImage id required");

  return prisma.galleryImage.delete({
    where: { id },
  });
};





// ================= Video Sections Api ================= //

const validateSource = (data: {
  sourceType: LandingVideoSource;
  youtubeUrl?: string;
  videoUrl?: string;
}) => {
  if (data.sourceType === LandingVideoSource.YOUTUBE) {
    if (!data.youtubeUrl) {
      throw new Error("YouTube URL is required for YOUTUBE source");
    }
    if (data.videoUrl) {
      throw new Error("Video upload not allowed for YOUTUBE source");
    }
  }

  if (data.sourceType === LandingVideoSource.UPLOAD) {
    if (!data.videoUrl) {
      throw new Error("Video file is required for UPLOAD source");
    }
    if (data.youtubeUrl) {
      throw new Error("YouTube URL not allowed for UPLOAD source");
    }
  }
};




const createLandingVideo = async (payload: {
  title: string;
  thumbnailUrl: string;
  sourceType: LandingVideoSource;
  youtubeUrl?: string;
  videoUrl?: string;
}) => {
  validateSource(payload);

  return prisma.landingVideo.create({
    data: payload,
  });
};

const getLandingVideos = async () => {
  return prisma.landingVideo.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

const updateLandingVideo = async (
  id: string,
  payload: Partial<{
    title: string;
    thumbnailUrl: string;
    sourceType: LandingVideoSource;
    youtubeUrl?: string;
    videoUrl?: string;
    isActive: boolean;
  }>
) => {
  if (!id) {
    throw new Error("Landing video id is required");
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("Nothing to update");
  }

  if (payload.sourceType) {
    validateSource(payload as any);
  }

  return prisma.landingVideo.update({
    where: { id },
    data: payload,
  });
};

const deleteLandingVideo = async (id: string) => {
  if (!id) {
    throw new Error("Landing video id is required");
  }

  const exists = await prisma.landingVideo.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    throw new Error("Landing video not found");
  }

 const data = await prisma.landingVideo.delete({
    where: { id },
  });


  return data;
};




export const LandingService = {
  createHeroSlide,
  getHeroSlides,
  deleteHeroSlide,
  createCompanyLogo,
  getAllCompanyLogos,
  deleteCompanyLogo,
  getFooterFromDB,
  upsertFooterIntoDB,
  softDeleteFooterFromDB,
  createOfficeIntoDB,
  getOfficesFromDB,
  updateOfficeIntoDB,
  softDeleteOfficeFromDB,
  updateFooterIntoDB,
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
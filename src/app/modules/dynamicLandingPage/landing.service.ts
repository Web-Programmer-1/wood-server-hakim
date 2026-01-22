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
};
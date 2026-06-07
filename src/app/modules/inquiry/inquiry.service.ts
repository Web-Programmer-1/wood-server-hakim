import { sendEmail, EmailAttachment } from "../../../utils/nodeMailer";
import { prisma } from "../../shared/prisma";
import { CreateInquiryPayload } from "../review/review.interface";


export const createInquiryService = async (
  payload: CreateInquiryPayload
) => {
  const { name, email, phone, subject, message } = payload;


  if (!name || !email || !subject || !message) {
    throw new Error("VALIDATION_ERROR");
  }


  const lastInquiry = await prisma.inquiry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;

  if (lastInquiry?.code) {
    const last = Number(lastInquiry.code.replace("INQ-", ""));
    if (!isNaN(last)) {
      nextNumber = last + 1;
    }
  }

  const code = `INQ-${String(nextNumber).padStart(5, "0")}`;

 
  const inquiry = await prisma.inquiry.create({
    data: {
      code,
      name,
      email,
      phone,
      subject,
      message,
    },
  });

  return inquiry;
};










export type GetInquiriesParams = {
  page?: number;
  limit?: number;
  status?: "ALL" | "PENDING" | "RESPONDED" | "CONVERTED";
  dateFilter?: "ALL" | "TODAY" | "WEEK" | "MONTH";
  search?: string;
};


export const getInquiriesService = async (
  params: GetInquiriesParams
) => {

  const page =
    params.page && params.page > 0 ? params.page : 1;
  const limit =
    params.limit && params.limit > 0 ? params.limit : 10;

  const skip = (page - 1) * limit;

  const where: any = {};


  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }


  if (params.search) {
    where.OR = [
      {
        name: {
          contains: params.search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: params.search,
          mode: "insensitive",
        },
      },
      {
        subject: {
          contains: params.search,
          mode: "insensitive",
        },
      },
      {
        code: {
          contains: params.search,
          mode: "insensitive",
        },
      },
    ];
  }


  const dateFilter = params.dateFilter || "ALL";

  if (dateFilter !== "ALL") {
    const now = new Date();

    let startDate: Date;
    let endDate: Date;


    if (dateFilter === "TODAY") {
      startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0, 0, 0, 0
        )
      );

      endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23, 59, 59, 999
        )
      );
    }

  
    else if (dateFilter === "WEEK") {
      const utcDay = now.getUTCDay(); 

      startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - utcDay,
          0, 0, 0, 0
        )
      );

      endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + 6);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    // MONTH (UTC)
    else if (dateFilter === "MONTH") {
      startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0, 0, 0, 0
        )
      );

      endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          0,
          23, 59, 59, 999
        )
      );
    }

    where.createdAt = {
      gte: startDate!,
      lte: endDate!,
    };
  }






  const [data, total] = await Promise.all([
  prisma.inquiry.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },

    
    include: {
      respondedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          profile:{
            select:{
              avatarUri: true,
              profession:true,
              occupationType: true,
              bio: true,
            }
          }
        },
      },
    },
  }),

  prisma.inquiry.count({ where }),
]);





  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};








export const getInquiryByIdService = async (id: string) => {
  if (!id) {
    throw new Error("INVALID_ID");
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },

    include: {
      respondedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          profile:{
            select:{
              avatarUri: true,
              profession:true,
              occupationType: true,
              bio: true,
            }
          }
        },
      },
    },



  });

  if (!inquiry) {
    throw new Error("NOT_FOUND");
  }

  return inquiry;
};










type InquiryStatus = "PENDING" | "RESPONDED" | "CONVERTED";

export const updateInquiryStatusService = async (
  inquiryId: string,
  newStatus: InquiryStatus
) => {
  if (!inquiryId || !newStatus) {
    throw new Error("INVALID_INPUT");
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, status: true },
  });

  if (!inquiry) {
    throw new Error("NOT_FOUND");
  }

  const currentStatus = inquiry.status as InquiryStatus;


  const allowedTransitions: Record<
    InquiryStatus,
    InquiryStatus[]
  > = {
    PENDING: ["RESPONDED"],
    RESPONDED: ["CONVERTED"],
    CONVERTED: [],
  };

  const allowedNextStatuses =
    allowedTransitions[currentStatus];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw new Error("INVALID_TRANSITION");
  }


  const updatedInquiry = await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status: newStatus,
    },
  });

  return updatedInquiry;
};















type SendQuotationPayload = {
  subject: string;
  message: string;
  attachments?: EmailAttachment[];
};

export const sendQuotationEmailService = async (
  inquiryId: string,
  adminId: string,
  payload: SendQuotationPayload
) => {

  if (!inquiryId || !adminId) {
    throw new Error("INVALID_INPUT");
  }

  if (!payload.subject || !payload.message) {
    throw new Error("INVALID_EMAIL_CONTENT");
  }


  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
  });

  if (!inquiry) {
    throw new Error("NOT_FOUND");
  }


  if (inquiry.status === "CONVERTED") {
    throw new Error("ALREADY_CONVERTED");
  }


  const attachments = payload.attachments ?? [];

  const attachmentNote = attachments.length
    ? `<p style="color:#555;">${attachments.length} file(s) attached.</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Dear ${inquiry.name},</p>

      <p>${payload.message.replace(/\n/g, "<br/>")}</p>

      ${attachmentNote}

      <br/>
      <p>
        Regards,<br/>
        <strong>WTS Wood Limited</strong>
      </p>

      <hr/>
      <small>
        This email was sent in response to your inquiry.
      </small>
    </div>
  `;


  await sendEmail(
    inquiry.email,        // to: the customer
    payload.subject,
    payload.message,
    html,
    {
      attachments,
      // Replies from the customer should land in the company inbox.
      replyTo: process.env.BUSINESS_EMAIL || "info@woodtechsolutionbd.com",
    }
  );


  const updatedInquiry = await prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      status: "RESPONDED",
      respondedByAdminId: adminId,
      respondedAt: new Date(),
    },
  });

  return updatedInquiry;
};










export const deleteInquiryService = async (
  inquiryId: string,
  adminId: string
) => {
  if (!inquiryId || !adminId) {
    throw new Error("INVALID_INPUT");
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
  });

  if (!inquiry) {
    throw new Error("NOT_FOUND");
  }

  // ❌ Already deleted
  if (inquiry.isDeleted) {
    throw new Error("ALREADY_DELETED");
  }

  // 🔐 Optional rule:
  // Converted inquiry delete block
  if (inquiry.status === "CONVERTED") {
    throw new Error("CANNOT_DELETE_CONVERTED");
  }

  return prisma.inquiry.update({
    where: { id: inquiryId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

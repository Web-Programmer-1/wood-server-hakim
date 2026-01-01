import { Request, Response } from "express";
import { createInquiryService, getInquiriesService, getInquiryByIdService, sendQuotationEmailService, updateInquiryStatusService } from "./inquiry.service";

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const inquiry = await createInquiryService(req.body);

    return res.status(201).json({
      success: true,
      message: "Inquiry created successfully",
      data: inquiry,
    });
  } catch (error: any) {
    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        success: false,
        message: "name, email, subject, message are required",
      });
    }

    console.error("Create Inquiry Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};






export const getInquiries = async (
  req: Request,
  res: Response
) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const status = req.query.status as any;
    const dateFilter = req.query.dateFilter as any;
    const search = req.query.search as string;

    const result = await getInquiriesService({
      page,
      limit,
      status,
      dateFilter,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("Get Inquiries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};









export const getInquiryById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const inquiry = await getInquiryByIdService(id);

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error: any) {
    if (error.message === "INVALID_ID") {
      return res.status(400).json({
        success: false,
        message: "Inquiry id is required",
      });
    }

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    console.error("Get Inquiry By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};








export const updateInquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedInquiry =
      await updateInquiryStatusService(id, status);

    return res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully",
      data: updatedInquiry,
    });
  } catch (error: any) {
    if (error.message === "INVALID_INPUT") {
      return res.status(400).json({
        success: false,
        message: "Inquiry id and status are required",
      });
    }

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    if (error.message === "INVALID_TRANSITION") {
      return res.status(409).json({
        success: false,
        message:
          "Invalid status transition for this inquiry",
      });
    }

    console.error("Update Inquiry Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
















export const sendQuotationEmail = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const { subject, message } = req.body;

    const result = await sendQuotationEmailService(
      id,
      adminId!,
      { subject, message }
    );

    return res.status(200).json({
      success: true,
      message: "Quotation email sent successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "INVALID_INPUT") {
      return res.status(400).json({
        success: false,
        message: "Inquiry id or admin id missing",
      });
    }

    if (error.message === "INVALID_EMAIL_CONTENT") {
      return res.status(400).json({
        success: false,
        message: "Email subject and message are required",
      });
    }

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    if (error.message === "ALREADY_CONVERTED") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot send quotation for a converted inquiry",
      });
    }

    console.error("Send Quotation Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send quotation email",
    });
  }
};
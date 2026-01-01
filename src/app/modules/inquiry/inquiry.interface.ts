 export type GetInquiriesParams = {
  page?: number;
  limit?: number;
  status?: string;
  dateFilter?: string;
  search?: string;
};


 export type InquiryStatus = "PENDING" | "RESPONDED" | "CONVERTED";

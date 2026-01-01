type CreateInquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export { CreateInquiryPayload };
import { UserRole, UserStatus, VerificationStatus } from "@prisma/client";
// add
export interface RegisterInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  password: string;
}

export interface LoginInput {
  email?: string | null;
  phone?: string | null;
  password: string;
}

export interface GoogleLoginInput {
  googleId: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface IEmailVerify{
  email:string
  otp:string
  verificationStatus:VerificationStatus
}




export interface RegisterBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender : string
}







 export interface  IRegister{
  id: string;
  createdAt: Date;
  password:string
  updatedAt: Date;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: Profile;
}

interface Profile {
  id: string;
  avatarUri: string | null;
  bio: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  profession: string | null;
  occupationType: string | null;
  nationalId: string | null;
  socialLinks: Record<string, string>;
  verificationStatus: string;
  profileCompleted: number;
}
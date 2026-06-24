import { UserRole } from './enums';

export interface IDefaultAddress {
  city: string;
  street: string;
  houseNumber: string;
}

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roles: UserRole[];
  defaultAddress?: IDefaultAddress;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMeResponse {
  user: IUser;
}

export interface IAuthPayload {
  token: string;
  user: IUser;
}

/** Sent to POST /auth/register */
export interface IRegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  defaultAddress?: IDefaultAddress;
}

/** Sent to POST /auth/login */
export interface ILoginDto {
  email: string;
  password: string;
}

/** Sent to PATCH /auth/active-role */
export interface ISwitchRoleDto {
  activeRole: UserRole;
}

import { UserRole } from './enums';

export interface IDefaultAddress {
  city: string;
  street: string;
  houseNumber: string;
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  roles: UserRole[];
  defaultAddress?: IDefaultAddress;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthPayload {
  token: string;
  user: IUser;
}

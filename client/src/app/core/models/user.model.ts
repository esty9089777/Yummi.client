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

/** Sent to PATCH /auth/me */
export interface IUpdateProfileDto {
  fullName?: string;
  phone?: string;
  defaultAddress?: IDefaultAddress | null;
}

/** Sent to POST /users/employees */
export interface ICreateEmployeeDto {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  roles: UserRole[];
  defaultAddress?: IDefaultAddress;
}

/** Sent to PATCH /users/:id/roles */
export interface IUpdateRolesDto {
  roles: UserRole[];
}

/** Sent to POST /users/:id/roles/add */
export interface IAddRoleDto {
  role: UserRole;
}

/** Sent to PATCH /users/:id/status */
export interface IUpdateStatusDto {
  isActive: boolean;
}

export interface IUserResponse {
  user: IUser;
}

export interface IUsersResponse {
  users: IUser[];
}

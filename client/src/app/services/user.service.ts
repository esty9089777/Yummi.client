import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../core/models/api-response.model';
import {
  IAddRoleDto,
  ICreateEmployeeDto,
  IUpdateProfileDto,
  IUpdateRolesDto,
  IUpdateStatusDto,
  IUser,
  IUserResponse,
  IUsersResponse,
} from '../core/models/user.model';
import { UserRole } from '../core/models/enums';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  async getEmployees(): Promise<IUser[]> {
    const res = await this.api.http.get<ApiResponse<IUsersResponse>>('/users/employees');
    const { users } = this.api.unwrap(res);
    return users;
  }

  async getById(id: string): Promise<IUser> {
    const res = await this.api.http.get<ApiResponse<IUserResponse>>(`/users/${id}`);
    const { user } = this.api.unwrap(res);
    return user;
  }

  async createEmployee(dto: ICreateEmployeeDto): Promise<IUser> {
    const res = await this.api.http.post<ApiResponse<IUserResponse>>('/users/employees', dto);
    const { user } = this.api.unwrap(res);
    return user;
  }

  async updateRoles(id: string, dto: IUpdateRolesDto): Promise<IUser> {
    const res = await this.api.http.patch<ApiResponse<IUserResponse>>(`/users/${id}/roles`, dto);
    const { user } = this.api.unwrap(res);
    return user;
  }

  async addRole(id: string, dto: IAddRoleDto): Promise<IUser> {
    const res = await this.api.http.post<ApiResponse<IUserResponse>>(
      `/users/${id}/roles/add`,
      dto,
    );
    const { user } = this.api.unwrap(res);
    return user;
  }

  async removeRole(id: string, role: UserRole): Promise<IUser> {
    const res = await this.api.http.delete<ApiResponse<IUserResponse>>(
      `/users/${id}/roles/${role}`,
    );
    const { user } = this.api.unwrap(res);
    return user;
  }

  async updateStatus(id: string, dto: IUpdateStatusDto): Promise<IUser> {
    const res = await this.api.http.patch<ApiResponse<IUserResponse>>(
      `/users/${id}/status`,
      dto,
    );
    const { user } = this.api.unwrap(res);
    return user;
  }
}

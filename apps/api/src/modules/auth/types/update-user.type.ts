export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  deletedAt?: Date | null;
};

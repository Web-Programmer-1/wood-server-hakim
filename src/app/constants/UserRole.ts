export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SOCIAL_MANAGER = "SOCIAL_MANAGER",
  CUSTOMER = "CUSTOMER",
}

// Role groups for convenient guard composition.
export const ROLE_GROUPS = {
  // Full backoffice access (everything an admin can do).
  ADMINS: [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const,
  // Operations team: products, machines, orders, inventory, inquiry.
  OPS: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const,
  // Content & marketing team: blogs and site settings.
  CONTENT: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SOCIAL_MANAGER] as const,
  // Any authenticated dashboard user (staff). Useful for shared admin reads.
  STAFF: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER,
  ] as const,
  // Anyone signed in, including customers.
  ANY_AUTH: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER,
  ] as const,
  // Social manager also has CUSTOMER access per product spec.
  CUSTOMER_LIKE: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SOCIAL_MANAGER,
    UserRole.CUSTOMER,
  ] as const,
} as const;

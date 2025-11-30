export enum RateLimitTTLEnum {
  EVERY_5_SECONDS = 5000,
}

export enum RateLimitEnum {
  LIMIT_5_TIMES = 5,
}

export enum SyStemPrefixEnum {
  CLUSTER = 'clu',
  PROJECT = 'project',
  ORGANIZATION = 'organization',
}

// Permission System Enums
export enum OrgRoleEnum {
  OWNER = 'OWNER',
  BILLING_ADMIN = 'BILLING_ADMIN',
  MEMBER = 'MEMBER',
}

export enum ProjectRoleEnum {
  ADMIN = 'ADMIN',
  READ_WRITE = 'READ_WRITE',
  READ_ONLY = 'READ_ONLY',
}

export enum PermissionNameEnum {
  // org-scope permissions
  ORG_VIEW = 'ORG_VIEW',
  ORG_MANAGE_MEMBERS = 'ORG_MANAGE_MEMBERS',
  ORG_MANAGE_BILLING = 'ORG_MANAGE_BILLING',
  ORG_MANAGE_SETTINGS = 'ORG_MANAGE_SETTINGS',

  // project-scope permissions
  PROJECT_VIEW = 'PROJECT_VIEW',
  PROJECT_MANAGE = 'PROJECT_MANAGE',
  COLLECTION_READ = 'COLLECTION_READ',
  COLLECTION_WRITE = 'COLLECTION_WRITE',
}

export enum SeatStatusEnum {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

export enum SeatTypeEnum {
  VIP = 'VIP',
  STANDARD = 'STANDARD',
  COUPLE = 'COUPLE',
}

export enum BookingStatusEnum {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentProviderEnum {
  STRIPE = 'STRIPE',
  MOMO = 'MOMO',
}

export enum PaymentCurrencyEnum {
  VND = 'vnd',
  USD = 'usd',
}

// Bu dosya, kullanıcı modelinin TypeScript tipini tanımlar
export interface User {
  _id?: string
  /** Multi-tenant: will become required later; optional now for migration phase */
  tenantId?: string
  username: string
  phone: string
  password: string
  createdAt?: Date
}

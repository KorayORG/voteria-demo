// Bu dosya, kullanıcı modelinin TypeScript tipini tanımlar
export interface User {
  _id?: string;
  username: string;
  phone: string;
  password: string;
  createdAt?: Date;
}

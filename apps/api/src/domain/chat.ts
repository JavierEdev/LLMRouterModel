export type Role = "user" | "model";

export type ContentMsg = {
  role: Role;
  parts: { text: string }[];
};
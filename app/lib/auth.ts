import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/app/lib/db";

const TOKEN_COOKIE = "token";
const TOKEN_TTL = "7d";
const BCRYPT_ROUNDS = 12;

const ROLE_RANK: Record<Role, number> = {
  GUEST: 0,
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export type SafeUser = Omit<User, "password">;

export interface TokenPayload extends JwtPayload {
  userId: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => bcrypt.compare(password, hashedPassword);

export const generateToken = (userId: string): string =>
  jwt.sign({ userId }, getJwtSecret(), { expiresIn: TOKEN_TTL });

export const verifyToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, getJwtSecret());

  if (typeof payload === "string" || typeof payload.userId !== "string") {
    throw new jwt.JsonWebTokenError("Token payload is missing userId");
  }

  return payload as TokenPayload;
};

export const getCurrentUser = cache(
  async (): Promise<SafeUser | null> => {
    try {
      const token = (await cookies()).get(TOKEN_COOKIE)?.value;
      if (!token) return null;

      const { userId } = verifyToken(token);

      return await prisma.user.findUnique({
        where: { id: userId },
        omit: { password: true },
      });
    } catch (error) {
      console.error("getCurrentUser failed:", error);
      return null;
    }
  },
);

export const checkUserPermission = (
  user: Pick<SafeUser, "role">,
  requiredRole: Role,
): boolean => ROLE_RANK[user.role] >= ROLE_RANK[requiredRole];

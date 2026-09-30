import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/app/lib/db";

export async function GET() {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      {
        status: 503,
      }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      message: "Database connected successfully",
    },
    {
      status: 200,
    }
  );
}
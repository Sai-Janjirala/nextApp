import { getCurrentUser } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request : NextRequest){
  try{
    const user = await getCurrentUser();
    if(!user){
      return NextResponse.json({
        error : "u r not Authenticated"
      },
    {status :  401}
    )
    }

    return NextResponse.json(user);
  } catch (error){
    console.error("error" , error);
    return NextResponse.json({
      error :  "internal server error  , something went wrong",
    },
  {status : 500}
  )
  }
}
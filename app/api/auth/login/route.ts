import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateToken,hashPassword, verifyPassword  } from "@/app/lib/auth";
import {prisma} from "@/app/lib/db";

export async function POST(request : NextRequest){
  try{
    const {email,password } = await request.json();
    // validate require fields
    if( !email || !password){
      return NextResponse.json({
        error : "email & password are required or not valid"
      },
    {status : 400}
    )
    }
    // find exisating user

    const userFromDb = await prisma.user.findUnique({
      where : {email},
      include : {Team : true}
    })
    
    if(!userFromDb){
      return NextResponse.json({
        error : "invalid credentials"
      },
    {status : 401 }   )
    }
    const isValidPassword = await verifyPassword(password,userFromDb.password);

    if(!isValidPassword){
      return NextResponse.json({
        error : "invalid credentials"
      },
    {status : 401 }   )
    }

  

    //generate token

    const token = generateToken(userFromDb.id)

    // create response
    const response = NextResponse.json({
      user:{
        id: userFromDb.id,
        email : userFromDb.email,
        name:  userFromDb.name,
        role: userFromDb.role,
        teamId : userFromDb.teamId,
        team : userFromDb.Team,
        token
      }
    })

    // set cookie
    response.cookies.set("token" , token , {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:  "lax",
      maxAge: 60 * 60 * 24 * 7
    } )

    return response;
  } catch (error){
    console.error("registratioun faileds ", error);
    return NextResponse.json({
      error : "Internal server error , something went wrong !!"
    },{status : 500 })
  }
}

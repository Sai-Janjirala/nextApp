import { generateToken,hashPassword  } from "@/app/lib/auth";
import {prisma} from "@/app/lib/db";
import { Role } from "@/app/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request : NextRequest){
  try{
    const {name,email,password , teamCode} = await request.json();
    // validate require fields
    if(!name || !email || !password){
      return NextResponse.json({
        error : "name,email & password are required or not valid"
      },
    {status : 400}
    )
    }
    // find exisating user

    const existingUser = await prisma.user.findUnique({
      where : {email}
    })
    if(existingUser){
      return NextResponse.json({
        error:  "user with tyhis email address exissts"
      },
    {status : 409}
    )
    }
    let teamId: string | undefined;
    if(teamCode){
      const team = await prisma.team.findUnique({
        where :  {code : teamCode}
      })
      if(!team){
        return NextResponse.json({
          error : "Please enter a valid team code",
        },
      {status : 400}
      )
      }
      teamId = team.id;
    }

    const hashedPassword = await hashPassword(password);

    // first user become admin others become USer

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.USER;
    const user = await prisma.user.create({
      data : {
        name,
        email,
        password : hashedPassword,
        role,
        teamId

      },
      include : {
        Team : true,
      }
    })

    //generate token

    const token = generateToken(user.id)

    // create response
    const response = NextResponse.json({
      user:{
        id: user.id,
        email : user.email,
        name:  user.name,
        role: user.role,
        teamId : user.teamId,
        team : user.team,
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
    console.error("registratioun faileds ");
    return NextResponse.json({
      error : "Internal server error , something went wrong !!"
    },{status : 500 })
  }
}
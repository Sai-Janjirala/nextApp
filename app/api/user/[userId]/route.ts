import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request : NextRequest) {
  try {
    const user = await getCurrentUser();
    if(!user){
      return NextResponse.json({
        error :  "u r not authorised to access user information  "
      },{status : 401})
    }
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");
    const role = searchParams.get("role");

    // build where clause based on user role
    const where : Prisma.UserWhereInput = {};
    if(user.role === Role.ADMIN){
      // admin can see all users
    } else if (user.role === Role.MANAGER){
      // managers can see their team or cross team users but not cross team managers

      where.OR = [{teamId : user.teamId} , {role : Role.USER}];

    } else {
      // regular users can only see in their team

      where.teamId = user.teamId;
      where.role = {not : Role.ADMIN}
    }

    // additional filters 
    if(teamId){
      where.teamId = teamId
    }
    if(role){
      where.role = role as Role;
    }

    const users = await prisma.user.findMany ({
      where,
       select :  {
        id: true,
        email : true,
        name : true,
        role : true,
        Team :  {
          select  : {
            id:  true,
            name:  true
          }
        },
        createdAt : true,
       },
       orderBy : {createdAt : "desc"}
    })

    return NextResponse.json({users})
  } catch (error) {
    console.error ("het Users error  : " , error );
    return NextResponse.json({
      error : "itnernal server error , something went wrong"
    },{status : 500 })
  }
}
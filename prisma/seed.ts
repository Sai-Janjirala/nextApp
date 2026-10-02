import { prisma } from "@/app/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const PASSWORD = "Password123!";

const teams = [
  { name : "Engineering" , code : "ENG-2024" , description : "Product engineering team" },
  { name : "Design" , code : "DSG-2024" , description : "Product design and research team" },
  { name : "Operations" , code : "OPS-2024" , description : "Operations and support team" },
];

const users = [
  { name : "Admin User" , email : "admin@team.dev" , role : Role.ADMIN , teamCode : null },
  { name : "Eng Manager" , email : "manager.eng@team.dev" , role : Role.MANAGER , teamCode : "ENG-2024" },
  { name : "Ops Manager" , email : "manager.ops@team.dev" , role : Role.MANAGER , teamCode : "OPS-2024" },
  { name : "Eng User" , email : "user.eng@team.dev" , role : Role.USER , teamCode : "ENG-2024" },
  { name : "Design User" , email : "user.design@team.dev" , role : Role.USER , teamCode : "DSG-2024" },
  { name : "Guest User" , email : "guest@team.dev" , role : Role.GUEST , teamCode : null },
];

async function main(){
  console.log("starting db seed ");

  const hashedPassword = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const teamByCode = new Map<string , string>();
  for(const team of teams){
    const record = await prisma.team.upsert({
      where : {code : team.code},
      update : {name : team.name , description : team.description},
      create : team
    })
    teamByCode.set(team.code , record.id);
  }

  for(const user of users){
    const teamId = user.teamCode ? teamByCode.get(user.teamCode) ?? null : null;
    await prisma.user.upsert({
      where : {email : user.email},
      update : {
        name : user.name,
        role : user.role,
        password : hashedPassword,
        teamId
      },
      create : {
        name : user.name,
        email : user.email,
        role : user.role,
        password : hashedPassword,
        teamId
      }
    })
  }

  console.log("teams in db : " + (await prisma.team.count()));
  console.log("users in db : " + (await prisma.user.count()));
  console.log("");
  console.log("team codes :");
  for(const team of teams){
    console.log("  " + team.code + "  ->  " + team.name);
  }
  console.log("");
  console.log("logins ( password for every account : " + PASSWORD + " ) :");
  for(const user of users){
    console.log("  " + user.role + "  " + user.email + (user.teamCode ? "   team=" + user.teamCode : ""));
  }
}
main()
.catch ((e) => {
  console.error("seeding failed  : " , e);
  process.exit(1);
}).finally(async()=>{
  await prisma.$disconnect();
})

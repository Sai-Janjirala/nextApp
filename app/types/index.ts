export enum role{
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
  GUEST ="GUEST"
}
 
export interface user{
  id : string;
  name : string;
  email : string;
  role : role;
  teamId?: string;
  team?: Team;
  createdAt : Date;
  updatedAt  : Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  members: user[];
  createdAt: Date;
  updatedAt: Date;
}
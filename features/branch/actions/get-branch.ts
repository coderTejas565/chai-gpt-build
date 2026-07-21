"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/features/auth/action/require-user";


export async function getBranch(
    conversationId:string,
    branchId:string
){

    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
        where:{
            id:branchId,
            conversation:{
                id:conversationId,
                userId:user.id
            }
        }
    });


    if(!branch){
        throw new Error("Branch not found");
    }


    return branch;
}
"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/features/auth/action/require-user";


export async function listBranches(conversationId:string){

    const user = await requireUser();


    const branches = await prisma.branch.findMany({
        where:{
            conversationId,
            conversation:{
                userId:user.id
            }
        },
        orderBy:{
            createdAt:"asc"
        },
        select:{
            id:true,
            name:true,
            createdAt:true,
        }
    });


    return branches;
}
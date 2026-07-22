"use client";

import { useQuery } from "@tanstack/react-query";
import { listBranches } from "../actions/list-branches";


export function useBranches(conversationId:string){

    return useQuery({
        queryKey:["branches",conversationId],
        queryFn:()=>listBranches(conversationId),
    });

}
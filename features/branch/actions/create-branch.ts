"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";

/**
 * Creates a new branch from a specific message.
 *
 * Copies all messages from the source branch until the selected message.
 */
export async function createBranch({
  sourceBranchId,
  fromMessageId,
  name,
}: {
  sourceBranchId: string;
  fromMessageId: string;
  name?: string;
}) {
  const user = await requireUser();

  // 1. Verify branch ownership
  const sourceBranch = await prisma.branch.findFirst({
    where: {
      id: sourceBranchId,
      conversation: {
        userId: user.id,
      },
    },
    include: {
      conversation: true,
    },
  });

  if (!sourceBranch) {
    throw new Error("Branch not found");
  }


  // 2. Get messages until selected message
  const sourceMessages = await prisma.message.findMany({
    where: {
      branchId: sourceBranchId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });


  const messagesToCopy = [];

  for (const message of sourceMessages) {
    messagesToCopy.push(message);

    if (message.id === fromMessageId) {
      break;
    }
  }


  if (!messagesToCopy.some((m) => m.id === fromMessageId)) {
    throw new Error("Message not found in branch");
  }


  // 3. Create new branch
  const branchCount = await prisma.branch.count({
    where: {
      conversationId: sourceBranch.conversationId,
    },
  });


  const newBranch = await prisma.branch.create({
    data: {
      conversationId: sourceBranch.conversationId,
      name: name ?? `Branch ${branchCount}`,
    },
  });


  // 4. Copy messages while preserving parent tree
  const idMap = new Map<string, string>();


  for (const message of messagesToCopy) {

    const copiedMessage = await prisma.message.create({
      data: {
        branchId: newBranch.id,

        originalMessageId:
          message.originalMessageId ?? message.id,

        role: message.role,

        status: message.status,

        content: message.content,

        parts: message.parts ?? undefined,

        metadata: message.metadata ?? undefined,

        parentMessageId:
          message.parentMessageId
            ? idMap.get(message.parentMessageId)
            : null,
      },
    });


    idMap.set(
      message.id,
      copiedMessage.id
    );
  }


  return {
    conversationId: sourceBranch.conversationId,
    branchId: newBranch.id,
  };
}
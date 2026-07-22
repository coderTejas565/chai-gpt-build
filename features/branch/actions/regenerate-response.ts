"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

type RegenerateResponseInput = {
  sourceBranchId: string;
  assistantMessageId: string;
};

export async function regenerateResponse({
  sourceBranchId,
  assistantMessageId,
}: RegenerateResponseInput) {
  const user = await requireUser();

  // Verify branch ownership
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

  // Assistant message being regenerated
  const assistantMessage = await prisma.message.findFirst({
    where: {
      id: assistantMessageId,
      branchId: sourceBranchId,
      role: "ASSISTANT",
    },
  });

  if (!assistantMessage) {
    throw new Error("Assistant message not found");
  }

  // Previous user message
  if (!assistantMessage.parentMessageId) {
    throw new Error("Assistant has no parent user message");
  }

  // Copy everything up to the user message
  const messages = await prisma.message.findMany({
    where: {
      branchId: sourceBranchId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const cutoff = messages.findIndex(
    (m) => m.id === assistantMessage.parentMessageId
  );

  if (cutoff === -1) {
    throw new Error("Parent user message not found");
  }

  const messagesToCopy = messages.slice(0, cutoff + 1);

  // Create new branch
  const newBranch = await prisma.branch.create({
    data: {
      conversationId: sourceBranch.conversationId,
      name: `Branch ${Date.now()}`,
    },
  });

  // Copy messages
  let parentMessageId: string | null = null;

  for (const message of messagesToCopy) {
    const newId = crypto.randomUUID();

    await prisma.message.create({
      data: {
        id: newId,
        branchId: newBranch.id,
        parentMessageId,
        role: message.role,
        status: message.status,
        content: message.content,
        parts:message.parts === null
    ? Prisma.JsonNull
    : (message.parts as Prisma.InputJsonValue),
    metadata:message.metadata === null
    ? Prisma.JsonNull
    : (message.metadata as Prisma.InputJsonValue),
      },
    });

    parentMessageId = newId;
  }

  return {
    conversationId: sourceBranch.conversationId,
    branchId: newBranch.id,
  };
}
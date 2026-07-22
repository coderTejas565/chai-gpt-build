import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { webSearch } from "@/features/ai/tools";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  stepCountIs,
  type UIMessage,
} from "ai";

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const {
  message,
  id: branchId,
  regenerate = false,
}: {
  message: UIMessage;
  id: string;
  regenerate?: boolean;
} = await req.json();

    if (!branchId) {
    return new Response("Missing branch id", { status: 400 });
}

    const user = await requireUser();

    const branch = await prisma.branch.findFirst({
  where:{
    id: branchId,
    conversation:{
      userId:user.id
    }
  },
  include:{
    conversation:true
  }
});

    if (!branch) {
        return new Response("Branch not found", { status:404 });
    }

    let messages = await loadChatMessages(branch.id);

if (!regenerate) {
    const alreadySaved = messages.some(
        (storedMessage) => storedMessage.id === message.id
    );

    if (!alreadySaved) {
        messages = [...messages, message];

        await saveChatMessages(branch.id, [message]);
    }
}

const result = streamText({
    model: getChatModel(branch.conversation.model),

    system:
      branch.conversation.systemPrompt ??
      "You are ChaiGPT, a helpful assistant.",

    messages: await convertToModelMessages(messages),

    tools: {
      webSearch,
    },

    stopWhen: stepCountIs(5),
});

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream:toUIMessageStream({
           stream:result.stream,
           originalMessages:messages,
           generateMessageId:createIdGenerator({prefix:"msg" , size:16}),
           onEnd:async({messages:finalMessages})=>{
            try {
                await saveChatMessages(branch.id , finalMessages , {updateTitle:false})
            } catch (error) {
                console.error(error);
            }
           }
        })
    })

}
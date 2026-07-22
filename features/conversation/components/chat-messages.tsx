"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";

import { regenerateResponse } from "@/features/branch/actions/regenerate-response";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function hasToolPart(message: UIMessage) {
  return message.parts.some((part) =>
    part.type.startsWith("tool-")
  );
}

function ToolStatus({ message }: { message: UIMessage }) {
  const toolPart = message.parts.find((part) =>
    part.type.startsWith("tool-")
  );

  if (!toolPart) return null;

  return (
    <div className="text-sm text-muted-foreground">
      🔎 Searching web...
    </div>
  );
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
  branchId: string;
};

/**
 * Renders the conversation message list with markdown responses and a loading indicator.
 */
export function ChatMessages({
  messages,
  status,
  branchId,
}: ChatMessagesProps) {
  const router = useRouter();

  async function handleBranch(messageId: string) {
  try {
    const result = await regenerateResponse({
    sourceBranchId: branchId,
    assistantMessageId: messageId,
});

    router.push(
  `/c/${result.conversationId}?branch=${result.branchId}&regen=1`
);

  } catch (error) {
    console.error(error);
  }
}

  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

    const lastAssistantId = [...messages]
  .reverse()
  .find((message) => message.role === "assistant")?.id;

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
  const isLastAssistant =
    message.role === "assistant" &&
    message.id === lastAssistantId;

  return (
    <Message key={message.id} from={message.role}>
      <MessageContent>
        {hasToolPart(message) && (
          <ToolStatus message={message} />
        )}

        <MessageResponse>
          {getMessageText(message)}
        </MessageResponse>

        {isLastAssistant && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleBranch(message.id)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </MessageContent>
    </Message>
  );
})}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
   
    </Conversation>
  );
}
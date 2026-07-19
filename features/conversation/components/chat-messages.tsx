"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
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
};

/**
 * Renders the conversation message list with markdown responses and a loading indicator.
 */
export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {hasToolPart(message) && (
  <ToolStatus message={message} />
)}

<MessageResponse>
  {getMessageText(message)}
</MessageResponse>
            </MessageContent>
          </Message>
        ))}

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

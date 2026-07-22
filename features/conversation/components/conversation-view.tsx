"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import React, { useEffect, useMemo, useRef } from "react";
import { useConversations } from "../hooks/use-conversation";
import { queryKeys } from "../utils/query-keys";
import { toast } from "sonner";
import { ChatEmpty } from "./chat-empty";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { BranchSwitcher } from "./branch-switcher";
import { useRouter } from "next/navigation";

type ConversationViewProps = {
    branchId: string;
    conversationId: string;
    initialMessages: UIMessage[];
    shouldRegenerate: boolean;
};

/**
 * Main chat view — renders messages and handles AI streaming for a branch.
 */
export const ConversationView = ({
    branchId,
    conversationId,
    initialMessages,
    shouldRegenerate,
}: ConversationViewProps) => {

    const queryClient = useQueryClient();
    const router = useRouter();
    const hasRegenerated = useRef(false);
    const { data: conversations } = useConversations();

const transport = useMemo(
  () =>
    new DefaultChatTransport({
      api: "/api/chat",

      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          id: branchId,
          message: messages.at(-1)!,
        },
      }),
    }),
  [branchId]
);


    const {
        messages,
        sendMessage,
        status,
    } = useChat({
        id: branchId,
        messages: initialMessages,
        transport,

        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },

        onError: (error) => {
            toast.error(error.message);
        },
    });

    useEffect(() => {
  if (!shouldRegenerate) return;

  if (hasRegenerated.current) return;
  hasRegenerated.current = true;

  const lastUser = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUser) return;

  const text = lastUser.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  if (!text) return;

  void sendMessage({ text });

  router.replace(`/c/${conversationId}?branch=${branchId}`);
}, [
  shouldRegenerate,
  messages,
  sendMessage,
  router,
  conversationId,
  branchId,
]);



    const title =
        conversations?.find(
            (item) => item.id === conversationId
        )?.title ?? "Chat";


    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">

            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />

                <Separator
                    orientation="vertical"
                    className="mx-1 h-4"
                />

                <h1 className="truncate text-sm font-medium">
                    {title}
                </h1>
            </header>


            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages
    messages={messages}
    status={status}
    branchId={branchId}
/>
            )}

            <BranchSwitcher
 conversationId={conversationId}
 activeBranchId={branchId}
/>


            <ChatComposer
                onSend={(text) => {
                    void sendMessage({
                        text,
                    });
                }}
                isSending={status !== "ready"}
                autoFocus
            />

        </div>
    );
};
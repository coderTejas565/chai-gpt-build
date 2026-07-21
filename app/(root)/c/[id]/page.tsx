import { loadChatMessages } from '@/features/ai/actions/chat-store';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { ConversationView } from '@/features/conversation/components/conversation-view';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ branch?: string }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 */
const page = async ({
    params,
    searchParams,
}: ConversationPageProps) => {

    const { id } = await params;
    const { branch } = await searchParams;

    if (!branch) {
        notFound();
    }

    try {
        await getConversation(id);
    } catch {
        notFound();
    }

    const initialMessages = await loadChatMessages(branch);

    return (
        <ConversationView
    key={branch}
    branchId={branch}
    conversationId={id}
    initialMessages={initialMessages}
/>
    );
};

export default page;
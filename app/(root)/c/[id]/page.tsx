import { loadChatMessages } from "@/features/ai/actions/chat-store";
import { ConversationView } from "@/features/conversation/components/conversation-view";
import { notFound } from "next/navigation";
import { getBranch } from "@/features/branch/actions/get-branch";

type ConversationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    branch?: string;
    regen?: string;
  }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given branch.
 */
const Page = async ({
  params,
  searchParams,
}: ConversationPageProps) => {
  const { id } = await params;
  const { branch, regen } = await searchParams;

  if (!branch) {
    notFound();
  }

  try {
    await getBranch(id, branch);
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
      shouldRegenerate={regen === "1"}
    />
  );
};

export default Page;
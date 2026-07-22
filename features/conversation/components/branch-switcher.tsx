"use client";

import { useRouter } from "next/navigation";
import { GitBranchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBranches } from "@/features/branch/hooks/use-branches";

type Props = {
  conversationId: string;
  activeBranchId: string;
};

export function BranchSwitcher({
  conversationId,
  activeBranchId,
}: Props) {
  const router = useRouter();

  const { data: branches } = useBranches(conversationId);

  if (!branches || branches.length <= 1) {
    return null;
  }

  return (
    <div className="border-t bg-muted/20 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <GitBranchIcon className="h-3.5 w-3.5" />
        <span>Branches</span>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t p-3">
        {branches.map((branch) => {
          const isActive = branch.id === activeBranchId;

          return (
            <Button
              key={branch.id}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() =>
                router.push(
                  `/c/${conversationId}?branch=${branch.id}`
                )
              }
            >
              {branch.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
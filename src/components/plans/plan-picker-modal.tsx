"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { PlanCards } from "@/components/plans/plan-cards";
import type { PlanKey } from "@/lib/plans";

export interface PlanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (planKey: PlanKey) => void;
  onSelectPlan?: (planKey: PlanKey) => void;
  disabled?: boolean;
  pendingPlan?: PlanKey | null;
  selectedPlan?: PlanKey | null;
  title?: string;
  subtitle?: string;
}

export function PlanPickerModal({
  isOpen,
  onClose,
  onSelect,
  onSelectPlan,
  disabled = false,
  pendingPlan = null,
  selectedPlan = null,
  title = "Choose your listing plan",
  subtitle = "One-time payment, no subscription. Secure payment by Razorpay.",
}: PlanPickerModalProps) {
  const handleSelect = onSelect || onSelectPlan || (() => {});
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-4xl"
      hideOkButton={true}
      showCloseButton={true}
      contentClassName="max-h-[90vh] overflow-y-auto"
    >
      <div className="pt-2">
        <PlanCards
          onSelect={handleSelect}
          disabled={disabled}
          pendingPlan={pendingPlan}
          selectedPlan={selectedPlan}
          mode="checkout"
        />
      </div>
    </Modal>
  );
}

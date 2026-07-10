import { StudioPlaceholder } from "@/components/studio/placeholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <StudioPlaceholder
      title="Settings"
      blurb="Workspace, team, billing and AI-provider configuration."
      icon={Settings}
      roadmap={[
        "Workspace & team management with RBAC (Owner, Admin, Analyst, Viewer)",
        "Invite teammates, mentions and activity logs",
        "Billing: Free / Starter / Professional / Enterprise via Stripe",
        "AI provider configuration (OpenAI-compatible endpoint & per-task models)",
        "Feature flags, audit logs and SSO (Google / Microsoft / SAML)",
      ]}
    />
  );
}

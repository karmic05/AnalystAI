import { StudioPlaceholder } from "@/components/studio/placeholder";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <StudioPlaceholder
      title="Reports"
      blurb="A library of generated executive reports with approvals, version history and scheduled delivery."
      icon={FileText}
      roadmap={[
        "Saved report library with search & filters",
        "Scheduled reports (daily / weekly / monthly) via email",
        "Approval workflows with comments and mentions",
        "Version history and one-click restore",
        "Export to PDF, Word and PowerPoint",
      ]}
    />
  );
}

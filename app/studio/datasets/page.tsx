import { StudioPlaceholder } from "@/components/studio/placeholder";
import { Database } from "lucide-react";

export default function DatasetsPage() {
  return (
    <StudioPlaceholder
      title="Datasets"
      blurb="Your workspace's data catalog: every uploaded file, connection, and saved dataset."
      icon={Database}
      roadmap={[
        "Persistent dataset catalog with row/column stats",
        "Cloud warehouses: Snowflake, BigQuery, Databricks, Redshift",
        "Live database connectors: PostgreSQL, MySQL, SQL Server, Oracle, MongoDB, Redis",
        "Cloud storage and lakes: AWS S3, Azure Blob, Google Cloud Storage",
        "Collaboration sources: SharePoint lists, Google Sheets, REST APIs",
        "Streaming windows: Apache Kafka topics",
        "Row-level security and workspace permissions",
      ]}
    />
  );
}

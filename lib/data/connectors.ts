import type { ComponentType } from "react";
import {
  SiSnowflake,
  SiDatabricks,
  SiGooglecloud,
  SiGooglebigquery,
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiGooglesheets,
  SiApachekafka,
  SiSap,
} from "react-icons/si";
import { DiMsqlServer } from "react-icons/di";
import { FileText, Braces, ClipboardPaste, Database, Webhook } from "lucide-react";
import {
  OracleLogo,
  AwsLogo,
  AzureLogo,
  SharePointLogo,
  type BrandLogoProps,
} from "@/components/brand-logos";

/**
 * Connector catalog for AnalystAI.
 *
 * Every connector feeds the same profiling pipeline in lib/analysis, so the
 * engine does not care where the rows came from. Sources with status
 * "available" ship in this build (file and paste ingest). Sources with status
 * "planned" are on the production roadmap and map to the same schema.
 */

export type ConnectorCategory =
  | "Cloud & Warehouse"
  | "Database"
  | "Files & Collaboration"
  | "Enterprise & Streaming"
  | "Ingest";

export type ConnectorStatus = "available" | "planned";

export type ConnectorKind = "brand" | "ingest";

export type ConnectorLogo = ComponentType<BrandLogoProps>;

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  kind: ConnectorKind;
  /** Brand accent color (hex or CSS var), used for the logo and hover state. */
  color: string;
  logo: ConnectorLogo;
  blurb: string;
}

export const CONNECTORS: Connector[] = [
  // ---- Available now: file and paste ingest ----
  {
    id: "csv",
    name: "CSV",
    category: "Ingest",
    status: "available",
    kind: "ingest",
    color: "var(--cyan)",
    logo: FileText,
    blurb: "Upload a .csv file. Schema detection, type inference, and missing-value and duplicate checks run automatically.",
  },
  {
    id: "json",
    name: "JSON",
    category: "Ingest",
    status: "available",
    kind: "ingest",
    color: "var(--cyan)",
    logo: Braces,
    blurb: "Upload a .json file or an array of records. Nested objects are flattened into columns.",
  },
  {
    id: "paste",
    name: "Paste",
    category: "Ingest",
    status: "available",
    kind: "ingest",
    color: "var(--cyan)",
    logo: ClipboardPaste,
    blurb: "Paste rows from any spreadsheet, tab or comma separated, straight into the profiler.",
  },
  {
    id: "sample",
    name: "Sample",
    category: "Ingest",
    status: "available",
    kind: "ingest",
    color: "var(--cyan)",
    logo: Database,
    blurb: "Load the built-in SaaS-revenue sample dataset to try the full pipeline with no file.",
  },

  // ---- Cloud & Warehouse ----
  {
    id: "snowflake",
    name: "Snowflake",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#29B5E8",
    logo: SiSnowflake,
    blurb: "Cloud data warehouse. Run a SQL query and stream the result rows into the profiler.",
  },
  {
    id: "databricks",
    name: "Databricks",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#FF3621",
    logo: SiDatabricks,
    blurb: "Lakehouse analytics. Read Delta tables and notebook outputs as analyzable rows.",
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#FF9900",
    logo: AwsLogo,
    blurb: "S3 buckets and Redshift clusters, pulled through the same ingest path as files.",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#0078D4",
    logo: AzureLogo,
    blurb: "Azure SQL, Synapse, and Blob Storage, mapped to the unified analyst schema.",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#4285F4",
    logo: SiGooglecloud,
    blurb: "BigQuery, Cloud SQL, and Cloud Storage objects, ingested as tables.",
  },
  {
    id: "bigquery",
    name: "BigQuery",
    category: "Cloud & Warehouse",
    status: "planned",
    kind: "brand",
    color: "#4285F4",
    logo: SiGooglebigquery,
    blurb: "Run a query, stream the result rows straight into the engine, no export step.",
  },

  // ---- Database ----
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#4169E1",
    logo: SiPostgresql,
    blurb: "Connect by connection string, enumerate schemas, and profile the tables you pick.",
  },
  {
    id: "mysql",
    name: "MySQL",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#4479A1",
    logo: SiMysql,
    blurb: "Same connection model as Postgres, with type mapping tuned for MySQL numerics and dates.",
  },
  {
    id: "sqlserver",
    name: "Microsoft SQL Server",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#CC2927",
    logo: DiMsqlServer,
    blurb: "SQL Server and Azure SQL Managed Instance, profiled through the standard pipeline.",
  },
  {
    id: "oracle",
    name: "Oracle Database",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#F80000",
    logo: OracleLogo,
    blurb: "Oracle Database, with NUMBER and DATE column mapping into the analyst types.",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#47A248",
    logo: SiMongodb,
    blurb: "MongoDB collections, flattened to rows with per-field type inference.",
  },
  {
    id: "redis",
    name: "Redis",
    category: "Database",
    status: "planned",
    kind: "brand",
    color: "#DC382D",
    logo: SiRedis,
    blurb: "Redis keys and streams, sampled into tabular form for quick profiling.",
  },

  // ---- Files & Collaboration ----
  {
    id: "sharepoint",
    name: "Microsoft SharePoint",
    category: "Files & Collaboration",
    status: "planned",
    kind: "brand",
    color: "#03787C",
    logo: SharePointLogo,
    blurb: "SharePoint lists and document libraries, pulled as structured rows.",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "Files & Collaboration",
    status: "planned",
    kind: "brand",
    color: "#0F9D58",
    logo: SiGooglesheets,
    blurb: "Live spreadsheet ranges, refreshed on a schedule you control.",
  },

  // ---- Enterprise & Streaming ----
  {
    id: "kafka",
    name: "Apache Kafka",
    category: "Enterprise & Streaming",
    status: "planned",
    kind: "brand",
    color: "#8B8B9E",
    logo: SiApachekafka,
    blurb: "Kafka topics consumed into a rolling window for trend and anomaly work.",
  },
  {
    id: "sap",
    name: "SAP",
    category: "Enterprise & Streaming",
    status: "planned",
    kind: "brand",
    color: "#0FAAFF",
    logo: SiSap,
    blurb: "SAP tables and HANA views, mapped into the analyst schema.",
  },
];

export const BRAND_CATEGORIES: ConnectorCategory[] = [
  "Cloud & Warehouse",
  "Database",
  "Files & Collaboration",
  "Enterprise & Streaming",
];

export function brandConnectors(): Connector[] {
  return CONNECTORS.filter((c) => c.kind === "brand");
}

export function ingestConnectors(): Connector[] {
  return CONNECTORS.filter((c) => c.kind === "ingest");
}

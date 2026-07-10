import type { CSSProperties } from "react";

/**
 * Brand wordmarks for providers whose icon glyphs were removed from the open
 * icon sets (Microsoft Azure, Microsoft SharePoint, Amazon Web Services, Oracle)
 * for trademark reasons. Each renders as an inline SVG that scales by `size`
 * (treated as height in pixels) and uses `currentColor` so it inherits the
 * surrounding color, matching how react-icons glyphs behave.
 */

export type BrandLogoProps = {
  size?: number | string;
  className?: string;
  title?: string;
};

const SANS = "Inter, system-ui, -apple-system, Segoe UI, sans-serif";
const svgStyle: CSSProperties = { width: "auto", overflow: "visible" };

export function OracleLogo({ size = 24, className, title = "Oracle" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 108 24"
      height={size}
      className={className}
      role="img"
      aria-label={title}
      style={svgStyle}
    >
      <text
        x="0"
        y="19"
        fontFamily={SANS}
        fontWeight={700}
        fontSize="22"
        letterSpacing="0.5"
        fill="currentColor"
      >
        ORACLE
      </text>
    </svg>
  );
}

export function AwsLogo({ size = 24, className, title = "Amazon Web Services" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 66 40"
      height={size}
      className={className}
      role="img"
      aria-label={title}
      style={svgStyle}
    >
      <text
        x="33"
        y="20"
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={700}
        fontSize="22"
        fill="currentColor"
      >
        aws
      </text>
      <path
        d="M12 28 Q33 37 51 28"
        stroke="#FF9900"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M46 25.5 L52 28 L47 32"
        stroke="#FF9900"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AzureLogo({ size = 24, className, title = "Microsoft Azure" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 92 24"
      height={size}
      className={className}
      role="img"
      aria-label={title}
      style={svgStyle}
    >
      <text
        x="0"
        y="19"
        fontFamily={SANS}
        fontWeight={700}
        fontSize="22"
        fill="currentColor"
      >
        Azure
      </text>
    </svg>
  );
}

export function SharePointLogo({ size = 24, className, title = "Microsoft SharePoint" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 132 24"
      height={size}
      className={className}
      role="img"
      aria-label={title}
      style={svgStyle}
    >
      <text
        x="0"
        y="19"
        fontFamily={SANS}
        fontWeight={700}
        fontSize="22"
        fill="currentColor"
      >
        SharePoint
      </text>
    </svg>
  );
}

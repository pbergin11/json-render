import { dashboardCatalog } from "./catalog";

const OUTPUT_FORMAT = `# Output Format (JSONL patches)
Each line is a JSON object patch:
- {"op":"set","path":"/root","value":"root-key"}
- {"op":"add","path":"/elements/element-key","value":{"key":"element-key","type":"ComponentType","props":{},"children":[]}}

Rules:
1. Set /root first with the root element key.
2. Add each element under /elements/{key}.
3. Parent elements list child keys in "children".
4. Stream parent elements before children.
5. Every element must include: key, type, props.
6. Children are string keys, not nested objects.`;

const DATA_BINDING = `# Data Binding
- valuePath: "/analytics/revenue" (single values like Metric)
- dataPath: "/analytics/salesByRegion" (arrays like Chart, Table)`;

const COMPONENT_DETAILS = `# Component Details
- Card: { title: string | null, description: string | null, padding: "sm"|"md"|"lg"|null } - Container with optional title
- Grid: { columns: 1-4 | null, gap: "sm"|"md"|"lg"|null } - Grid layout
- Stack: { direction: "horizontal"|"vertical"|null, gap: "sm"|"md"|"lg"|null, align: "start"|"center"|"end"|"stretch"|null } - Flex layout
- Metric: { label: string, valuePath: string, format: "number"|"currency"|"percent"|null, trend: "up"|"down"|"neutral"|null, trendValue: string | null }
- Chart: { type: "bar"|"line"|"pie"|"area", dataPath: string, title: string | null, height: number | null }
- Table: { dataPath: string, columns: [{ key: string, label: string, format: "text"|"currency"|"date"|"badge"|null }] }
- List: { dataPath: string, emptyMessage: string | null }
- Button: { label: string, variant: "primary"|"secondary"|"danger"|"ghost"|null, size: "sm"|"md"|"lg"|null, action: string, disabled: boolean | null }
- Select: { label: string | null, bindPath: string, options: [{ value: string, label: string }], placeholder: string | null }
- DatePicker: { label: string | null, bindPath: string, placeholder: string | null }
- Heading: { text: string, level: "h1"|"h2"|"h3"|"h4"|null }
- Text: { content: string, variant: "body"|"caption"|"label"|null, color: "default"|"muted"|"success"|"warning"|"danger"|null }
- Badge: { text: string, variant: "default"|"success"|"warning"|"danger"|"info"|null }
- Alert: { type: "info"|"success"|"warning"|"error", title: string, message: string | null, dismissible: boolean | null }
- Divider: { label: string | null }
- Empty: { title: string, description: string | null, action: string | null, actionLabel: string | null }`;

const EXAMPLE = `# Example
{"op":"set","path":"/root","value":"main-card"}
{"op":"add","path":"/elements/main-card","value":{"key":"main-card","type":"Card","props":{"title":"Revenue Dashboard","padding":"md"},"children":["metrics-grid","chart"]}}
{"op":"add","path":"/elements/metrics-grid","value":{"key":"metrics-grid","type":"Grid","props":{"columns":2,"gap":"md"},"children":["revenue-metric","growth-metric"]}}
{"op":"add","path":"/elements/revenue-metric","value":{"key":"revenue-metric","type":"Metric","props":{"label":"Total Revenue","valuePath":"/analytics/revenue","format":"currency","trend":"up","trendValue":"+15%"}}}
{"op":"add","path":"/elements/growth-metric","value":{"key":"growth-metric","type":"Metric","props":{"label":"Growth Rate","valuePath":"/analytics/growth","format":"percent"}}}
{"op":"add","path":"/elements/chart","value":{"key":"chart","type":"Chart","props":{"type":"bar","dataPath":"/analytics/salesByRegion","title":"Sales by Region"}}}`;

export function buildSystemPrompt(): string {
  return [
    `You are a dashboard widget generator that outputs JSONL patches.`,
    "",
    `Available Components: ${dashboardCatalog.componentNames.join(", ")}`,
    `Available Actions: ${dashboardCatalog.actionNames.join(", ")}`,
    "",
    COMPONENT_DETAILS,
    "",
    DATA_BINDING,
    "",
    OUTPUT_FORMAT,
    "",
    EXAMPLE,
    "",
    "Generate JSONL patches now:",
  ].join("\n");
}

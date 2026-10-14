// Shared shapes for the task map, catalog and recommendations.

export type DurationKey = "15m" | "30m" | "1h" | "2h" | "3h_plus";
export type FrequencyKey = "daily" | "few_week" | "weekly" | "monthly" | "lt_monthly";
export type Screen = "most_days" | "weekly" | "monthly";
export type Effort = "small" | "medium" | "large";
export type SolutionLevel = "existing_tool" | "automation" | "ai_agent" | "habit";

/** What a card is about, for the habit rules. Only "meeting" and "email" trigger anything. */
export type TaskKind = "meeting" | "email" | "other";

/** A card the visitor ticked. Only ticked cards ever become a Task. */
export interface Task {
  id: string;
  name: string;
  screen: Screen;
  /** Position on its screen; for "most_days" this is morning-to-afternoon order. */
  order: number;
  duration: DurationKey;
  frequency: FrequencyKey;
  /** Tool the visitor tapped or typed, if any. */
  tool?: string;
  kind: TaskKind;
  /** Signals recorded during the drill-down, keyed by field name (tool, volume, input, output, ...). */
  signals: Record<string, string>;
}

export interface Range {
  low: number;
  high: number;
}

export interface CatalogTool {
  id: string;
  name: string;
  url: string;
  /** ISO date the link and claim were last checked, YYYY-MM-DD. */
  checked: string;
  /** Words in the visitor's own tool answer that mean they already have this tool. */
  ownedIf?: string[];
}

export interface Pattern {
  id: string;
  name: string;
  level: SolutionLevel;
  /** One plain sentence describing the task shape, shown to the matching model. */
  shape?: string;
  /** Habits only: the code rule that suggests this pattern. */
  trigger?: string;
  /** The card must repeat at least this often to match. */
  minFrequency?: FrequencyKey;
  /** Signal names that must be recorded on the task for a match. */
  requiredSignals: string[];
  tools: CatalogTool[];
  /** Automation share as fractions (0.3 = 30%). Null when the catalog gives no figure. */
  share: Range | null;
  effort: Effort;
  firstStep: string;
  failureMode: string;
  sourceNote: string;
  status?: "draft" | "approved";
  /** True while the share range is a placeholder, not Chris's figure. */
  sharePlaceholder?: boolean;
}

/** Hours for one task, all computed in code. Null hours mean "not counted". */
export interface TaskHours {
  taskId: string;
  counted: boolean;
  hoursPerWeek: Range | null;
  midpoint: number;
}

export interface SavedHours {
  hoursPerWeek: Range;
  share: Range;
  saved: Range;
}

/** A recommendation as proposed by matching, before the reviewer sees it. */
export interface Recommendation {
  taskId: string;
  patternId: string;
  toolId?: string;
  /** Text the model quotes from the visitor's answers as evidence. */
  evidenceQuote: string;
  /** Every sentence the model wrote for this recommendation. */
  modelSentences: string[];
  /** Hours figures attached to the recommendation. Must equal what code computed. */
  hours: SavedHours | null;
}

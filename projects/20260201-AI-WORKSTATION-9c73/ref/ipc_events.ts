// Reference sample: IPC event payloads

export type ConfirmationRequiredEvent = {
  tool_call_id: string;
  action: string;
  target: string;
  risk_level: "low" | "medium" | "high";
  summary: string;
};

export type ToolDeniedEvent = {
  tool_call_id: string;
  reason: string;
};

export type ToolExecutedEvent = {
  tool_call_id: string;
  tool_name: string;
  result_summary: string;
};

export type AppSessionStartedEvent = {
  session_id: string;
  app_id: string;
  viewport_url: string;
};

export type AppSessionClosedEvent = {
  session_id: string;
  app_id: string;
};

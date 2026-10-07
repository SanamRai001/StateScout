export const ADVERSARIAL_IDENTITY_CASES = [
  {
    id: "meaningful-title-time",
    left: "#appointment-10",
    right: "#appointment-11",
    expected: "different",
    rationale: "Appointment time is represented only in the title and is meaningful application state.",
  },
  {
    id: "semantic-ref-query",
    left: "?ref=invoice-41#invoice",
    right: "?ref=invoice-42#invoice",
    expected: "different",
    rationale: "The ref query parameter identifies different invoices and is semantic in this fixture.",
  },
  {
    id: "tracking-utm-query",
    left: "#base",
    right: "?utm_source=phase6#base",
    expected: "same",
    rationale: "A known UTM tracking parameter is harmless noise.",
  },
  {
    id: "ordinary-query-id",
    left: "?appointmentId=41#base",
    right: "?appointmentId=42#base",
    expected: "different",
    rationale: "An ordinary non-tracking query value remains semantic.",
  },
  {
    id: "meaningful-heading-time",
    left: "#heading-10",
    right: "#heading-11",
    expected: "different",
    rationale: "Clock time in a visible heading is meaningful and must remain distinct.",
  },
  {
    id: "meaningful-control-time",
    left: "#control-10",
    right: "#control-11",
    expected: "different",
    rationale: "Clock time in an interactive control name is meaningful and must remain distinct.",
  },
] as const;

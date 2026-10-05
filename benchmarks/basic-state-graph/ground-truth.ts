export const BASIC_STATE_GRAPH_GROUND_TRUTH = {
  states: [
    "home",
    "menu-open",
    "dialog-open",
    "details",
    "about",
  ],
  transitions: [
    ["home", "open-menu", "menu-open"],
    ["menu-open", "close-menu", "home"],
    ["home", "open-dialog", "dialog-open"],
    ["dialog-open", "cancel-dialog", "home"],
    ["dialog-open", "open-details", "details"],
    ["home", "open-about", "about"],
    ["about", "open-details", "details"],
    ["about", "go-home", "home"],
    ["details", "go-home", "home"],
  ],
} as const;

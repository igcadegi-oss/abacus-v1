export const state = {
  route: "settings",
  language: "ua",
  settings: {
    mode: "prosto",
    chainLength: 2,
    examples: 10,
    display: "column",
    answerMode: "input"
  },
  results: {
    success: 0,
    total: 0,
    durationMs: 0,
    bestStreak: 0,
    history: []
  }
};

export function setRoute(route) {
  state.route = route;
}

export function setLanguagePreference(language) {
  state.language = language;
}

export function updateSettings(partial) {
  state.settings = { ...state.settings, ...partial };
}

export function setResults(results) {
  state.results = { ...state.results, ...results };
}

export function resetResults() {
  state.results = {
    success: 0,
    total: 0,
    durationMs: 0,
    bestStreak: 0,
    history: []
  };
}

export const state = {
  route: "settings",
  language: "ua",
  settings: {
    mode: "abacus",
    digits: "1",
    speed: "standard",
    rounds: 10,
    dictation: true
  },
  results: {
    success: 0,
    total: 0
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
  state.results = { ...results };
}

export function resetResults() {
  state.results = { success: 0, total: 0 };
}

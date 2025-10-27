export type ShortcutItem = {
  action: string        // nb-NO label
  tokens: string[]      // each key/gesture token rendered as a pill
  isGesture?: boolean   // style variant for gestures
}

export const HURTIGTASTER: ShortcutItem[] = [
  // Mobil/Tablet
  { action: "Panorér kart",       tokens: ["Dra finger"],           isGesture: true },
  { action: "Zoom inn/ut",        tokens: ["Knip"],                 isGesture: true },
  { action: "Roter kart",         tokens: ["To fingre + vri"],      isGesture: true },
  { action: "Vipp kart",          tokens: ["To fingre + skyv opp/ned"], isGesture: true },
  { action: "Zoom til punkt",     tokens: ["Dobbelttrykk"],         isGesture: true },

  // Desktop (PC/Mac)
  { action: "Søk",                    tokens: ["Ctrl", "K"] },
  { action: "Åpne/lukk meny",         tokens: ["Ctrl", "B"] },
  { action: "Avbryt/lukk",            tokens: ["Esc"] },
  { action: "Naviger søkeresultater", tokens: ["↑", "↓"] },
  { action: "Velg søkeresultat",      tokens: ["Enter"] },
  { action: "Fullfør søk",            tokens: ["Tab"] },
  { action: "Panorér kart",           tokens: ["Skyv"],              isGesture: true },
  { action: "Zoom inn/ut",            tokens: ["Rullehjul"],         isGesture: true },
  { action: "Zoom inn/ut (presis)",   tokens: ["Shift + rullehjul"], isGesture: true },
  { action: "Zoom til område",        tokens: ["Shift + skyv"],      isGesture: true },
  { action: "Vipp og roter kart",     tokens: ["Ctrl + skyv"],       isGesture: true },
  { action: "Zoom til punkt",         tokens: ["Dobbeltklikk"],      isGesture: true },
  { action: "Kopier koordinater fra kart", tokens: ["Ctrl + klikk"], isGesture: true },
]
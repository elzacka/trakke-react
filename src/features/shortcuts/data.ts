export type ShortcutItem = {
  action: string        // nb-NO label
  tokens: string[]      // each key/gesture token rendered as a pill
  isGesture?: boolean   // style variant for gestures
}

export const HURTIGTASTER: ShortcutItem[] = [
  // Desktop (PC/Mac)
  { action: "Søk",                    tokens: ["Ctrl", "K"] },
  { action: "Åpne/lukk meny",         tokens: ["Ctrl", "B"] },
  { action: "Avbryt/lukk",            tokens: ["Esc"] },
  { action: "Naviger søkeresultater", tokens: ["↑", "↓"] },
  { action: "Velg søkeresultat",      tokens: ["Enter"] },
  { action: "Fullfør søk",            tokens: ["Tab"] },
  { action: "Panorér kart",           tokens: ["Dra"],              isGesture: true },
  { action: "Zoom inn/ut",            tokens: ["Rullehjul"],        isGesture: true },
  { action: "Zoom til område",        tokens: ["Shift + dra"],      isGesture: true },
  { action: "Vipp og roter kart",     tokens: ["Ctrl + dra"],       isGesture: true },
  { action: "Zoom til punkt",         tokens: ["Dobbeltklikk"],     isGesture: true },
  { action: "Kopier koordinater",     tokens: ["Klikk koordinater"], isGesture: true },

  // Mobil/Tablet
  { action: "Panorér kart",       tokens: ["Dra finger"],           isGesture: true },
  { action: "Zoom inn/ut",        tokens: ["Knip"],                 isGesture: true },
  { action: "Roter kart",         tokens: ["To fingre + vri"],      isGesture: true },
  { action: "Vipp kart",          tokens: ["To fingre + skyv opp/ned"], isGesture: true },
  { action: "Zoom til punkt",     tokens: ["Dobbelttrykk"],         isGesture: true },
  { action: "Kopier koordinater", tokens: ["Trykk koordinater"],    isGesture: true },
]
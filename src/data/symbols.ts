// Norwegian Topographic Map Symbols - Official Kartverket Legend
// Exact match to "Tegnforklaring_Kartverket.png"

export interface MapSymbol {
  id: string
  name: string // Norwegian name
  description: string // Norwegian description
  category: string
  columnSide: 'left' | 'right'
  order: number
  visual: {
    type: 'line' | 'fill' | 'point' | 'symbol' | 'mixed'
    rgb?: [number, number, number]
    backgroundColor?: [number, number, number]
    lineWidth?: string
    style?: 'solid' | 'dashed' | 'dotted'
    pattern?: string
    shape?: 'square' | 'circle' | 'triangle' | 'custom'
  }
}

export const mapSymbols: MapSymbol[] = [
  // LEFT COLUMN - EXACT ORDER FROM KARTVERKET PNG

  // BYGNINGER OG BEFOLKET OMRÅDE (Buildings and Populated Areas)
  {
    id: 'bygninger_tettbebyggelse',
    name: 'Bygninger og tettbebyggelse',
    description: 'Bygninger og tettbebyggelse',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 1,
    visual: {
      type: 'fill',
      backgroundColor: [255, 220, 190], // From PDF: RGB(255,220,190)
      style: 'solid'
    }
  },
  {
    id: 'tettbebygget_omrade',
    name: 'Tettbebygget område',
    description: 'Tettbebygget område',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 2,
    visual: {
      type: 'fill',
      backgroundColor: [247, 190, 140], // From PDF: Distinct orange color
      style: 'solid'
    }
  },
  {
    id: 'spredt_bebyggelse_annet',
    name: 'Spredt bebyggelse. Annet',
    description: 'Spredt bebyggelse. Annet',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 3,
    visual: {
      type: 'fill',
      backgroundColor: [255, 220, 190],
      pattern: 'dots',
      style: 'solid'
    }
  },
  {
    id: 'gard_bolighus_hytte',
    name: 'Gård, bolighus, hytte, seter',
    description: 'Gård, bolighus, hytte, seter',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 4,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'square'
    }
  },
  {
    id: 'naust_bu_annet_utfyllende',
    name: 'Naust, bu. Annet, utfyllende m.v.',
    description: 'Naust, bu. Annet, utfyllende m.v.',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 5,
    visual: {
      type: 'point',
      rgb: [0, 0, 0],
      shape: 'circle'
    }
  },
  {
    id: 'andre_bygninger_verkshus',
    name: 'Andre bygninger. Øvrige bygninger',
    description: 'Andre bygninger. Øvrige bygninger',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 6,
    visual: {
      type: 'mixed',
      rgb: [0, 0, 0]
    }
  },
  {
    id: 'drivhus_verkshus_lager',
    name: 'Drivhus, verkshus, lager. Større bygg med spesiell funksjon',
    description: 'Drivhus, verkshus, lager. Større bygg med spesiell funksjon',
    category: 'bygninger_befolket_omrade',
    columnSide: 'left',
    order: 7,
    visual: {
      type: 'symbol',
      backgroundColor: [255, 255, 0], // Yellow
      rgb: [0, 0, 0],
      shape: 'square'
    }
  },

  // SAMFERDSEL (Transportation)
  {
    id: 'veinummer_europavei',
    name: 'Veinummer: Europavei',
    description: 'Europavei rutenummer',
    category: 'samferdsel',
    columnSide: 'left',
    order: 8,
    visual: {
      type: 'symbol',
      backgroundColor: [0, 128, 0], // Green
      rgb: [255, 255, 255] // White text
    }
  },
  {
    id: 'veinummer_stamvei',
    name: 'Veinummer: Stamvei',
    description: 'Stamvei rutenummer',
    category: 'samferdsel',
    columnSide: 'left',
    order: 9,
    visual: {
      type: 'symbol',
      backgroundColor: [255, 0, 0], // Red
      rgb: [255, 255, 255] // White text
    }
  },
  {
    id: 'veinummer_annen_riksvei',
    name: 'Veinummer: Annen riksvei',
    description: 'Riksvei rutenummer',
    category: 'samferdsel',
    columnSide: 'left',
    order: 10,
    visual: {
      type: 'symbol',
      backgroundColor: [255, 255, 255], // White
      rgb: [0, 0, 0] // Black text
    }
  },
  {
    id: 'europavei_riksvei_motorvei',
    name: 'Europavei, riksvei - motorvei',
    description: 'Europavei, riksvei med motorveistandard',
    category: 'samferdsel',
    columnSide: 'left',
    order: 11,
    visual: {
      type: 'line',
      rgb: [210, 35, 42], // From PDF: Red for European/National roads
      lineWidth: '4px',
      style: 'solid'
    }
  },
  {
    id: 'europavei_riksvei_adskilt_kjorebane',
    name: 'Europavei, riksvei - adskilt kjørebane',
    description: 'Europavei, riksvei med adskilt kjørebane',
    category: 'samferdsel',
    columnSide: 'left',
    order: 12,
    visual: {
      type: 'line',
      rgb: [210, 35, 42], // From PDF: Red for European/National roads
      lineWidth: '3px',
      style: 'solid'
    }
  },
  {
    id: 'europavei_riksvei',
    name: 'Europavei, riksvei',
    description: 'Europavei, riksvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 13,
    visual: {
      type: 'line',
      rgb: [210, 35, 42], // From PDF: Red for European/National roads
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'fylkesvei',
    name: 'Fylkesvei',
    description: 'Fylkesvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 14,
    visual: {
      type: 'line',
      rgb: [210, 35, 42], // From PDF: Same red for county roads
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'kommunal_vei',
    name: 'Kommunal vei',
    description: 'Kommunal vei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 15,
    visual: {
      type: 'line',
      rgb: [110, 110, 110], // From PDF: Gray for municipal roads
      lineWidth: '1.5px',
      style: 'solid'
    }
  },
  {
    id: 'privat_vei_skogsbilvei',
    name: 'Privat vei, skogsbilvei m.v.',
    description: 'Privat vei, skogsbilvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 16,
    visual: {
      type: 'line',
      rgb: [110, 110, 110], // From PDF: Gray for private roads
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'traktorvei',
    name: 'Traktorvei',
    description: 'Traktorvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 17,
    visual: {
      type: 'line',
      rgb: [156, 156, 156], // From PDF: Light gray for tractor roads
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'merket_sti_gang_sykkelvei',
    name: 'Merket sti, gang-/sykkelvei',
    description: 'Merket sti, gang- og sykkelvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 18,
    visual: {
      type: 'line',
      rgb: [195, 30, 40], // From PDF: Red for marked trails
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'sti_gangvei',
    name: 'Sti, gangvei',
    description: 'Sti, gangvei',
    category: 'samferdsel',
    columnSide: 'left',
    order: 19,
    visual: {
      type: 'line',
      rgb: [195, 30, 40], // From PDF: Red for trails
      lineWidth: '0.5px',
      style: 'dashed'
    }
  },
  {
    id: 'jernbane_enkelspor',
    name: 'Jernbane: Enkelspor',
    description: 'Jernbane med enkelspor',
    category: 'samferdsel',
    columnSide: 'left',
    order: 20,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '1px',
      style: 'solid',
      pattern: 'railway-single'
    }
  },
  {
    id: 'jernbane_flerspor',
    name: 'Jernbane: Flerspor',
    description: 'Jernbane med flere spor',
    category: 'samferdsel',
    columnSide: 'left',
    order: 21,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'solid',
      pattern: 'railway-multi'
    }
  },
  {
    id: 'jernbane_stasjon',
    name: 'Jernbane: Jernbanestasjon',
    description: 'Jernbanestasjon',
    category: 'samferdsel',
    columnSide: 'left',
    order: 22,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'jernbane_tunnel',
    name: 'Jernbane: Tunnel',
    description: 'Jernbanetunnel',
    category: 'samferdsel',
    columnSide: 'left',
    order: 23,
    visual: {
      type: 'line',
      rgb: [127, 127, 127], // From PDF: Gray for tunnel
      lineWidth: '1px',
      style: 'dashed',
      pattern: 'railway-tunnel'
    }
  },
  {
    id: 'bru',
    name: 'Bru',
    description: 'Bru',
    category: 'samferdsel',
    columnSide: 'left',
    order: 24,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'tunnel_vei',
    name: 'Tunnel: Vei',
    description: 'Veitunnel',
    category: 'samferdsel',
    columnSide: 'left',
    order: 25,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'dashed'
    }
  },
  {
    id: 'bilferge',
    name: 'Bilferge',
    description: 'Bilfergerute',
    category: 'samferdsel',
    columnSide: 'left',
    order: 26,
    visual: {
      type: 'line',
      rgb: [194, 31, 41], // From PDF: Red for ferry routes
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'passasjerferje',
    name: 'Passasjerferje',
    description: 'Passasjerferge',
    category: 'samferdsel',
    columnSide: 'left',
    order: 27,
    visual: {
      type: 'symbol',
      rgb: [194, 31, 41], // From PDF: Red for passenger ferry
      shape: 'custom'
    }
  },
  {
    id: 'flyplass',
    name: 'Flyplass',
    description: 'Flyplass',
    category: 'samferdsel',
    columnSide: 'left',
    order: 28,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'helikopterplass',
    name: 'Helikopterplass',
    description: 'Helikopterlandingsplass',
    category: 'samferdsel',
    columnSide: 'left',
    order: 29,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },

  // KRAFTLINJE (Power Lines)
  {
    id: 'kraftlinje_enkelinje',
    name: 'Kraftlinje: Enkelinje',
    description: 'Kraftoverføringslinje',
    category: 'kraftlinje',
    columnSide: 'left',
    order: 30,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '1px',
      style: 'solid'
    }
  },
  {
    id: 'kraftlinje_flere_linjer',
    name: 'Kraftlinje: Flere linjer',
    description: 'Kraftoverføringslinje med flere linjer',
    category: 'kraftlinje',
    columnSide: 'left',
    order: 31,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'solid',
      pattern: 'parallel'
    }
  },
  {
    id: 'vindmolle',
    name: 'Vindmølle',
    description: 'Vindkraftanlegg',
    category: 'kraftlinje',
    columnSide: 'left',
    order: 32,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },

  // INDUSTRI OG ANLEGG (Industry and Facilities) - continuing left column
  {
    id: 'industriomrade_fabrikk',
    name: 'Industriområde, fabrikk',
    description: 'Industriområde og fabrikkanlegg',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 33,
    visual: {
      type: 'fill',
      backgroundColor: [215, 215, 215], // Gray
      style: 'solid'
    }
  },
  {
    id: 'kraftstasjon_transformator',
    name: 'Kraftstasjon, transformatorstasjon',
    description: 'Kraftstasjon og transformator',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 34,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'square'
    }
  },
  {
    id: 'steinbrudd_grustak',
    name: 'Steinbrudd, grustak',
    description: 'Steinbrudd og grustakanlegg',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 35,
    visual: {
      type: 'fill',
      backgroundColor: [215, 215, 215],
      pattern: 'rocks',
      style: 'solid'
    }
  },
  {
    id: 'spesiell_punktdetalj',
    name: 'Spesiell punktdetalj',
    description: 'Spesielle punktdetaljer',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 36,
    visual: {
      type: 'symbol',
      rgb: [252, 247, 215], // Yellow with black outline
      backgroundColor: [252, 247, 215],
      shape: 'circle'
    }
  },
  {
    id: 'fyr_lykt',
    name: 'Fyr, lykt',
    description: 'Fyr og lykt for navigasjon',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 37,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'mast_telekommunikasjon',
    name: 'Mast for telekommunikasjon',
    description: 'Telekommunikasjonsmast',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 38,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'bygning_tank',
    name: 'Bygning, tank',
    description: 'Bygninger og tankanlegg',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 39,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'circle'
    }
  },
  {
    id: 'gruve_mine',
    name: 'Gruve, mine',
    description: 'Gruver og miner',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 40,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'tarn',
    name: 'Tårn',
    description: 'Tårn og høye konstruksjoner',
    category: 'industri_anlegg',
    columnSide: 'left',
    order: 41,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'triangle'
    }
  },

  // AREALBRUK (Land Use) - from PNG left column
  {
    id: 'park_idrettsplass',
    name: 'Park, idrettsplass',
    description: 'Parker og idrettsplasser',
    category: 'arealbruk',
    columnSide: 'left',
    order: 42,
    visual: {
      type: 'fill',
      backgroundColor: [155, 185, 60], // Green for parks
      style: 'solid'
    }
  },
  {
    id: 'gravplass',
    name: 'Gravplass',
    description: 'Gravplasser og kirkegårder',
    category: 'arealbruk',
    columnSide: 'left',
    order: 43,
    visual: {
      type: 'fill',
      backgroundColor: [155, 185, 60], // Same green
      style: 'solid'
    }
  },
  {
    id: 'alpinbakke_idrett',
    name: 'Alpinbakke, idrettsanlegg',
    description: 'Alpinbakker og idrettsanlegg',
    category: 'arealbruk',
    columnSide: 'left',
    order: 44,
    visual: {
      type: 'fill',
      backgroundColor: [155, 185, 60],
      style: 'solid'
    }
  },
  {
    id: 'campingplass',
    name: 'Campingplass',
    description: 'Campingplasser',
    category: 'arealbruk',
    columnSide: 'left',
    order: 45,
    visual: {
      type: 'symbol',
      rgb: [255, 0, 0], // Red triangle for camping
      shape: 'triangle'
    }
  },
  {
    id: 'skytebane',
    name: 'Skytebane',
    description: 'Skytebaner',
    category: 'arealbruk',
    columnSide: 'left',
    order: 46,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'turisthytte',
    name: 'Turisthytte',
    description: 'Turisthytter',
    category: 'arealbruk',
    columnSide: 'left',
    order: 47,
    visual: {
      type: 'symbol',
      rgb: [255, 0, 0], // Red square
      backgroundColor: [255, 255, 255], // White fill
      shape: 'square'
    }
  },

  // RIGHT COLUMN - EXACT ORDER FROM KARTVERKET PNG

  // ADMINISTRATIVE GRENSER (Administrative Boundaries)
  {
    id: 'riksgrense',
    name: 'Riksgrense',
    description: 'Riksgrense',
    category: 'administrative_grenser',
    columnSide: 'right',
    order: 50,
    visual: {
      type: 'line',
      rgb: [190, 90, 190], // From PDF: Purple for national boundaries
      lineWidth: '2px',
      style: 'dashed'
    }
  },
  {
    id: 'grunnlinje',
    name: 'Grunnlinje',
    description: 'Grunnlinje, territorialgrense',
    category: 'administrative_grenser',
    columnSide: 'right',
    order: 51,
    visual: {
      type: 'line',
      rgb: [210, 115, 60], // From PDF: Brown for baseline
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'fylkesgrense',
    name: 'Fylkesgrense',
    description: 'Fylkesgrense',
    category: 'administrative_grenser',
    columnSide: 'right',
    order: 52,
    visual: {
      type: 'line',
      rgb: [180, 135, 255], // From PDF: Light purple for county boundaries
      lineWidth: '1px',
      style: 'dashed'
    }
  },
  {
    id: 'kommunegrense',
    name: 'Kommunegrense',
    description: 'Kommunegrense',
    category: 'administrative_grenser',
    columnSide: 'right',
    order: 53,
    visual: {
      type: 'line',
      rgb: [180, 135, 255], // From PDF: Light purple for municipal boundaries
      lineWidth: '0.5px',
      style: 'dashed'
    }
  },
  {
    id: 'statsallmenningsgrense',
    name: 'Statsallmenningsgrense',
    description: 'Statsallmenning',
    category: 'administrative_grenser',
    columnSide: 'right',
    order: 54,
    visual: {
      type: 'line',
      rgb: [0, 0, 0], // From PDF: Black for state commons
      lineWidth: '1px',
      style: 'dashed'
    }
  },

  // HYDROGRAFI (Hydrography)
  {
    id: 'hydrografi_vann',
    name: 'Hydrografi',
    description: 'Vann og vassdrag',
    category: 'hydrografi',
    columnSide: 'right',
    order: 55,
    visual: {
      type: 'fill',
      backgroundColor: [224, 255, 255], // From PDF: Light blue for water
      rgb: [0, 166, 255] // Blue outline
    }
  },
  {
    id: 'elv_bekk',
    name: 'Elv, bekk',
    description: 'Elver og bekker',
    category: 'hydrografi',
    columnSide: 'right',
    order: 56,
    visual: {
      type: 'line',
      rgb: [0, 166, 255], // From PDF: Blue for rivers
      lineWidth: '1px',
      style: 'solid'
    }
  },
  {
    id: 'innsjokant',
    name: 'Innsjøkant',
    description: 'Innsjøkanter',
    category: 'hydrografi',
    columnSide: 'right',
    order: 57,
    visual: {
      type: 'line',
      rgb: [0, 166, 255], // From PDF: Blue for lake edges
      lineWidth: '1px',
      style: 'solid'
    }
  },
  {
    id: 'kanal_groft',
    name: 'Kanal, grøft',
    description: 'Kanaler og grøfter',
    category: 'hydrografi',
    columnSide: 'right',
    order: 58,
    visual: {
      type: 'line',
      rgb: [0, 166, 255], // From PDF: Blue for canals
      lineWidth: '0.5px',
      style: 'solid'
    }
  },
  {
    id: 'sno_isbre',
    name: 'Snø- og isbre',
    description: 'Snø og isbreer',
    category: 'hydrografi',
    columnSide: 'right',
    order: 59,
    visual: {
      type: 'fill',
      backgroundColor: [255, 255, 255], // White
      rgb: [0, 166, 255], // Blue outline
      style: 'solid',
      pattern: 'dotted'
    }
  },

  // KYSTLINJE OG TERRENGFORMER (Coastline and Terrain)
  {
    id: 'kystlinje',
    name: 'Kystlinje',
    description: 'Kystlinje',
    category: 'kystlinje_terreng',
    columnSide: 'right',
    order: 60,
    visual: {
      type: 'line',
      rgb: [0, 166, 255], // From PDF: Blue for coastline
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'terrenglinjer',
    name: 'Terrenglinjer',
    description: 'Høydekurver',
    category: 'kystlinje_terreng',
    columnSide: 'right',
    order: 61,
    visual: {
      type: 'line',
      rgb: [200, 133, 70], // From PDF: Brown for terrain lines
      lineWidth: '1px',
      style: 'solid'
    }
  },
  {
    id: 'fjell_berg',
    name: 'Fjell, berg',
    description: 'Fjell og berg i dagen',
    category: 'kystlinje_terreng',
    columnSide: 'right',
    order: 62,
    visual: {
      type: 'fill',
      backgroundColor: [255, 255, 230], // From PDF: Very light yellow
      style: 'solid'
    }
  },
  {
    id: 'morene_ur',
    name: 'Morene, ur',
    description: 'Morener og ur',
    category: 'kystlinje_terreng',
    columnSide: 'right',
    order: 63,
    visual: {
      type: 'fill',
      backgroundColor: [215, 215, 215], // Gray
      pattern: 'rocks',
      style: 'solid'
    }
  },

  // VEGETASJON (Vegetation)
  {
    id: 'dyrka_mark',
    name: 'Dyrka mark',
    description: 'Dyrket mark og jordbruksareal',
    category: 'vegetasjon',
    columnSide: 'right',
    order: 64,
    visual: {
      type: 'fill',
      backgroundColor: [255, 247, 163], // From PDF: Light yellow for cultivated land
      style: 'solid'
    }
  },
  {
    id: 'skog',
    name: 'Skog',
    description: 'Skog og skogområder',
    category: 'vegetasjon',
    columnSide: 'right',
    order: 65,
    visual: {
      type: 'fill',
      backgroundColor: [210, 230, 124], // From PDF: Green for forest
      style: 'solid'
    }
  },
  {
    id: 'myr',
    name: 'Myr',
    description: 'Myr og våtmark',
    category: 'vegetasjon',
    columnSide: 'right',
    order: 66,
    visual: {
      type: 'fill',
      backgroundColor: [130, 200, 240], // From PDF: Blue for wetlands
      pattern: 'lines',
      style: 'solid'
    }
  },
  {
    id: 'alpint_omrade',
    name: 'Alpint område',
    description: 'Alpine og høyfjellsområder',
    category: 'vegetasjon',
    columnSide: 'right',
    order: 67,
    visual: {
      type: 'fill',
      backgroundColor: [255, 255, 230], // Very light for alpine areas
      style: 'solid'
    }
  },

  // BEBYGGELSE OG TJENESTER (Settlement and Services) - right column
  {
    id: 'tettsted',
    name: 'Tettsted',
    description: 'Tettstedsområder',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 68,
    visual: {
      type: 'symbol',
      rgb: [247, 128, 128], // Red circle
      backgroundColor: [247, 128, 128],
      shape: 'circle'
    }
  },
  {
    id: 'kirke',
    name: 'Kirke',
    description: 'Kirker og kapell',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 69,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom' // Cross symbol
    }
  },
  {
    id: 'sykehus',
    name: 'Sykehus',
    description: 'Sykehus og helseinstitusjoner',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 70,
    visual: {
      type: 'symbol',
      rgb: [255, 0, 51], // Red cross
      backgroundColor: [255, 255, 255], // White background
      shape: 'custom'
    }
  },
  {
    id: 'skole',
    name: 'Skole',
    description: 'Skoler og utdanningsinstitusjoner',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 71,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'square'
    }
  },
  {
    id: 'post_telefon',
    name: 'Post, telefon',
    description: 'Post- og telefonkontorer',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 72,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'politi_brannstasjon',
    name: 'Politi, brannstasjon',
    description: 'Politi- og brannstasjoner',
    category: 'bebyggelse_tjenester',
    columnSide: 'right',
    order: 73,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },

  // GJENSTANDER (Objects) - right column
  {
    id: 'monument_minnesmerke',
    name: 'Monument, minnesmerke',
    description: 'Monumenter og minnesmerker',
    category: 'gjenstander',
    columnSide: 'right',
    order: 74,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'ruiner',
    name: 'Ruiner',
    description: 'Ruiner og historiske levninger',
    category: 'gjenstander',
    columnSide: 'right',
    order: 75,
    visual: {
      type: 'symbol',
      rgb: [0, 0, 0],
      shape: 'custom'
    }
  },
  {
    id: 'bru_konstruksjon',
    name: 'Bru, konstruksjon',
    description: 'Bruer og konstruksjoner',
    category: 'gjenstander',
    columnSide: 'right',
    order: 76,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'dam_sluse',
    name: 'Dam, sluse',
    description: 'Dammer og sluser',
    category: 'gjenstander',
    columnSide: 'right',
    order: 77,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'solid'
    }
  },
  {
    id: 'kai_molo',
    name: 'Kai, molo',
    description: 'Kaier og moloer',
    category: 'gjenstander',
    columnSide: 'right',
    order: 78,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '1px',
      style: 'solid'
    }
  },
  {
    id: 'tunnel_undergang',
    name: 'Tunnel, undergang',
    description: 'Tunneler og underganger',
    category: 'gjenstander',
    columnSide: 'right',
    order: 79,
    visual: {
      type: 'line',
      rgb: [0, 0, 0],
      lineWidth: '2px',
      style: 'dashed'
    }
  }
]

// Category definitions with Norwegian names
export const symbolCategories = {
  bygninger_befolket_omrade: {
    name: 'Bygninger og befolket område',
    description: 'Bebyggelse og bygninger',
    columnSide: 'left' as const
  },
  samferdsel: {
    name: 'Samferdsel',
    description: 'Veier, jernbaner og transport',
    columnSide: 'left' as const
  },
  kraftlinje: {
    name: 'Kraftlinje',
    description: 'Kraftlinjer og energianlegg',
    columnSide: 'left' as const
  },
  industri_anlegg: {
    name: 'Industri og anlegg',
    description: 'Industriområder og anlegg',
    columnSide: 'left' as const
  },
  arealbruk: {
    name: 'Arealbruk',
    description: 'Forskjellige typer arealbruk',
    columnSide: 'left' as const
  },
  administrative_grenser: {
    name: 'Administrative grenser',
    description: 'Grenser og områder',
    columnSide: 'right' as const
  },
  hydrografi: {
    name: 'Hydrografi',
    description: 'Vann og vassdrag',
    columnSide: 'right' as const
  },
  kystlinje_terreng: {
    name: 'Kystlinje og terrengformer',
    description: 'Kyst og terreng',
    columnSide: 'right' as const
  },
  vegetasjon: {
    name: 'Vegetasjon',
    description: 'Vegetasjon og arealbruk',
    columnSide: 'right' as const
  },
  bebyggelse_tjenester: {
    name: 'Bebyggelse og tjenester',
    description: 'Bebyggelse og offentlige tjenester',
    columnSide: 'right' as const
  },
  gjenstander: {
    name: 'Gjenstander',
    description: 'Forskjellige objekter og konstruksjoner',
    columnSide: 'right' as const
  }
}

// Helper functions
export const getSymbolsByCategory = (category: string) =>
  mapSymbols.filter(symbol => symbol.category === category)

export const getSymbolsByColumn = (columnSide: 'left' | 'right') =>
  mapSymbols.filter(symbol => symbol.columnSide === columnSide)

export const getSymbolById = (id: string) =>
  mapSymbols.find(symbol => symbol.id === id)

export const getAllSymbolsSorted = () =>
  mapSymbols.sort((a, b) => a.order - b.order)
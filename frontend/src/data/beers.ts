// Cerveses pròpies del grup Damm que es serveixen a la barra de La Plaça.
// Els noms es mostren amb tipografia genèrica (sense logotips oficials). `label` és el color dominant de l'etiqueta.
// Llista de demo: cal que algú de l'equip la confirmi amb el catàleg actual de Damm.
export interface Beer {
  key: string
  name: string
  style: string
  desc: string
  label: string
  ink: string
  tap?: boolean // si es serveix de tirador (la resta, en ampolla)
}

export const DAMM_BEERS: Beer[] = [
  { key: 'estrella', name: 'Estrella Damm', style: 'Lager mediterrània', desc: 'La clàssica de Barcelona, fresca i equilibrada.', label: '#C8102E', ink: '#FFFFFF', tap: true },
  { key: 'voll', name: 'Voll-Damm', style: 'Doble malta', desc: 'Intensa i amb cos, amb més malta.', label: '#5A0A14', ink: '#E9C46A', tap: true },
  { key: 'free', name: 'Free Damm', style: 'Sense alcohol 0,0', desc: 'Tot el gust, sense alcohol.', label: '#1E5BB8', ink: '#FFFFFF', tap: true },
  { key: 'lemon', name: 'Damm Lemon', style: 'Cervesa amb llimona', desc: 'Lleugera i refrescant, amb llimona.', label: '#F2C230', ink: '#1F1A18', tap: true },
  { key: 'inedit', name: 'Inedit', style: 'Blat i ordi', desc: 'Pensada per acompanyar la gastronomia.', label: '#1F1A18', ink: '#E2C27A', tap: true },
  { key: 'bock', name: 'Bock-Damm', style: 'Negra tipus Munic', desc: 'Torrada, amb notes de cafè i caramel.', label: '#3A2416', ink: '#E9C46A', tap: true },
  { key: 'malquerida', name: 'Malquerida', style: 'Vermella', desc: 'Cervesa de blat amb un toc fruitat.', label: '#D6336C', ink: '#FFFFFF', tap: true },
  { key: 'complot', name: 'Complot IPA', style: 'IPA', desc: 'Amarga i aromàtica, amb molt de llúpol.', label: '#2E7D5B', ink: '#FFFFFF', tap: true },
  { key: 'ak', name: 'A.K. Damm', style: 'Estil alsacià', desc: 'Sense filtrar, suau i aromàtica.', label: '#8A6A3B', ink: '#FFFFFF', tap: true },
  { key: 'xibeca', name: 'Xibeca', style: 'Lager suau', desc: 'La de tota la vida, en ampolla d’un litre.', label: '#D94436', ink: '#FFFFFF' },
  { key: 'daura', name: 'Daura Damm', style: 'Sense gluten', desc: 'Lager apta per a celíacs.', label: '#C9A227', ink: '#1F1A18' },
  { key: 'turia', name: 'Turia', style: 'Märzen torrada', desc: 'Color torrat, d’origen valencià.', label: '#9C3B1A', ink: '#FFFFFF' },
  { key: 'keler', name: 'Keler', style: 'Lager', desc: 'D’origen donostiarra.', label: '#1E3A5F', ink: '#FFFFFF' },
  { key: 'rosablanca', name: 'Rosa Blanca', style: 'Lager', desc: 'D’origen mallorquí.', label: '#B03A48', ink: '#FFFFFF' },
  { key: 'saaz', name: 'Saaz', style: 'Lager lleugera', desc: 'Amb llúpol Saaz, suau.', label: '#5C8C38', ink: '#FFFFFF' },
  { key: 'levante', name: 'Estrella de Levante', style: 'Lager', desc: 'Elaborada a la fàbrica de Múrcia.', label: '#D64A1E', ink: '#FFFFFF' },
  { key: 'victoria', name: 'Victoria', style: 'Lager', desc: 'Elaborada a la fàbrica de Màlaga.', label: '#1F3A7A', ink: '#FFFFFF' },
]

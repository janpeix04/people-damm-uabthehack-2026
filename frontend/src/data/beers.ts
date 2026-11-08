// Cerveses de Damm que es serveixen a la barra de La Plaça.
// Les fotos (public/beers/<key>.png) les ha aportat l'equip; al 3D només es fan servir els colors de l'etiqueta.
// `label` és el color dominant de l'etiqueta i `ink` el del text sobre aquest color.
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
  { key: 'estrella', name: 'Estrella Damm', style: 'Lager mediterrània', desc: 'La clàssica de Barcelona, amb malta, arròs i llúpol. Recepta original de 1876.', label: '#C8102E', ink: '#FFFFFF', tap: true },
  { key: 'voll', name: 'Voll-Damm', style: 'Doble malta · Märzenbier', desc: 'Intensa i amb cos, amb el doble de malta. Des de 1955.', label: '#1F3A32', ink: '#E9C46A', tap: true },
  { key: 'free', name: 'Free Damm', style: 'Sense alcohol 0,0', desc: 'Lager sense alcohol amb tot el gust de la cervesa.', label: '#2B9BE0', ink: '#0B2A4A', tap: true },
  { key: 'free-llimona', name: 'Free Damm Llimona', style: 'Sense alcohol 0,0 amb llimona', desc: 'Sense alcohol, amb notes de llimona i llima.', label: '#F5E03A', ink: '#1F4D1A', tap: true },
  { key: 'lemon', name: 'Damm Lemon', style: 'Clara mediterrània', desc: 'Sis parts de cervesa i quatre de llimona. Lleugera i refrescant.', label: '#F3EEDC', ink: '#2E7D32', tap: true },
  { key: 'inedit', name: 'Inedit', style: 'Malta i blat amb espècies', desc: 'Creada amb Ferran Adrià per acompanyar la gastronomia.', label: '#1A1414', ink: '#D9A06A', tap: true },
  { key: 'bock', name: 'Bock-Damm', style: 'Negra Munic', desc: 'Tres maltes torrades i caramel·litzades. Recepta de 1888.', label: '#1F1A18', ink: '#E07A2E', tap: true },
  { key: 'complot', name: 'Complot IPA', style: 'IPA mediterrània', desc: 'Vuit llúpols per a una IPA aromàtica i amarga.', label: '#2E7D5B', ink: '#FFFFFF', tap: true },
  { key: 'ak', name: 'A.K. Damm', style: 'Estil alsacià', desc: 'Pura malta, suau, segons el mètode d’Alsàcia de 1876.', label: '#C9C3B6', ink: '#5A3A22', tap: true },
  { key: 'free-tostada', name: 'Free Damm Torrada', style: 'Sense alcohol 0,0 torrada', desc: 'Sense alcohol, amb maltes torrades i més cos.', label: '#D9A66B', ink: '#1E3A8A' },
  { key: 'daura', name: 'Daura Damm', style: 'Lager sense gluten', desc: 'Una de les cerveses sense gluten més premiades del món.', label: '#D4462A', ink: '#FFFFFF' },
  { key: 'daura-marzen', name: 'Daura Märzen', style: 'Doble malta sense gluten', desc: 'La primera doble malta sense gluten.', label: '#1F3D2B', ink: '#C9A227' },
  { key: 'xibeca', name: 'Xibeca', style: 'Lager suau', desc: 'Original de 1931, en ampolla d’un litre per compartir.', label: '#C8102E', ink: '#F3EEDC' },
  { key: 'bohemia', name: 'Bohemia Damm Reserva 150', style: 'Edició 150 aniversari', desc: 'Reserva especial per celebrar els 150 anys de Damm.', label: '#1A1414', ink: '#C8102E' },
  { key: 'nadal', name: 'Cervesa de Nadal', style: 'Edició de temporada', desc: 'Color or vell, amb records de cereals torrats. Només a l’hivern.', label: '#F1E7C6', ink: '#B3121C' },
]

/** Ruta de la foto de l'ampolla (carpeta public/beers). */
export const beerImg = (b: Beer) => `${import.meta.env.BASE_URL}beers/${b.key}.png`

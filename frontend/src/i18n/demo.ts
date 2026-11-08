import { useCallback } from 'react'
import { useI18n, type Lang } from '.'

/**
 * Traduccions NOMÉS per a la demo del contingut que ve de la BD en català
 * (títols d'enquesta, recompenses, idees de La Plaça, departaments…).
 * Es busca pel text original; si no hi és, es retorna tal qual.
 * No toca la BD ni l'API: quan el backend serveixi contingut localitzat, es pot esborrar.
 */
type Entry = { es: string; en: string }

const DEMO: Record<string, Entry> = {
  // Departaments i zones
  'Fàbrica': { es: 'Fábrica', en: 'Factory' },
  'Logística': { es: 'Logística', en: 'Logistics' },
  'Comercial': { es: 'Comercial', en: 'Commercial' },
  'Oficina': { es: 'Oficina', en: 'Office' },
  'Oficines': { es: 'Oficinas', en: 'Offices' },
  'Altres': { es: 'Otros', en: 'Others' },
  'Envasat': { es: 'Envasado', en: 'Packaging' },
  'Sala de cocció': { es: 'Sala de cocción', en: 'Brewhouse' },
  'Recepció de malta': { es: 'Recepción de malta', en: 'Malt intake' },
  'Fermentació': { es: 'Fermentación', en: 'Fermentation' },
  'Manteniment': { es: 'Mantenimiento', en: 'Maintenance' },
  'Jardí de la cervesa': { es: 'Jardín de la cerveza', en: 'Beer garden' },

  // Títols d'enquesta
  'Avaluació de Clima i Benestar · Tardor 2026': { es: 'Evaluación de Clima y Bienestar · Otoño 2026', en: 'Climate & Wellbeing Assessment · Autumn 2026' },
  'Experiència d’Acollida i Onboarding': { es: 'Experiencia de Acogida y Onboarding', en: 'Welcome & Onboarding Experience' },
  'Flexibilitat, Eines Digitals i Oficines': { es: 'Flexibilidad, Herramientas Digitales y Oficinas', en: 'Flexibility, Digital Tools & Offices' },
  'Pols mensual · Novembre 2026': { es: 'Pulso mensual · Noviembre 2026', en: 'Monthly pulse · November 2026' },
  'Seguretat i Prevenció de Riscos a Planta': { es: 'Seguridad y Prevención de Riesgos en Planta', en: 'Plant Safety & Risk Prevention' },
  'Sostenibilitat, Eficiència Energètica i Residus': { es: 'Sostenibilidad, Eficiencia Energética y Residuos', en: 'Sustainability, Energy Efficiency & Waste' },
  'Torns, Descans i Conciliació a Planta': { es: 'Turnos, Descanso y Conciliación en Planta', en: 'Shifts, Rest & Work-Life Balance at the Plant' },

  // Recompenses
  'Cafè gratuït': { es: 'Café gratis', en: 'Free coffee' },
  'Cafè o infusió a la cafeteria de la teva planta.': { es: 'Café o infusión en la cafetería de tu planta.', en: 'Coffee or herbal tea at your site’s cafeteria.' },
  'Snack saludable': { es: 'Snack saludable', en: 'Healthy snack' },
  'Fruita seca, barreta o fruita de temporada.': { es: 'Frutos secos, barrita o fruta de temporada.', en: 'Nuts, a snack bar or seasonal fruit.' },
  'Beguda sense alcohol': { es: 'Bebida sin alcohol', en: 'Alcohol-free drink' },
  'Refresc, aigua amb gas o cervesa 0,0.': { es: 'Refresco, agua con gas o cerveza 0,0.', en: 'Soft drink, sparkling water or 0.0 beer.' },
  'Donació solidària': { es: 'Donación solidaria', en: 'Charity donation' },
  'Convertim punts en una donació a una entitat local.': { es: 'Convertimos puntos en una donación a una entidad local.', en: 'We turn points into a donation to a local charity.' },
  'Esmorzar complet': { es: 'Desayuno completo', en: 'Full breakfast' },
  'Entrepà i beguda a la cafeteria.': { es: 'Bocadillo y bebida en la cafetería.', en: 'Sandwich and a drink at the cafeteria.' },
  'Visita a l’antiga fàbrica': { es: 'Visita a la antigua fábrica', en: 'Visit to the old brewery' },
  'Visita guiada per a tu i un acompanyant.': { es: 'Visita guiada para ti y un acompañante.', en: 'Guided tour for you and a guest.' },

  // Idees publicades a La Plaça
  "Els nous calendaris de torns publicats amb tres setmanes d'antelació ens ajuden molt a conciliar amb la família.": { es: 'Los nuevos calendarios de turnos publicados con tres semanas de antelación nos ayudan mucho a conciliar con la familia.', en: 'New shift calendars published three weeks in advance really help us balance work and family.' },
  "A la línia d'envasat necessitaríem 5 minuts més de solapament entre torns per traspassar incidències sense presses.": { es: 'En la línea de envasado necesitaríamos 5 minutos más de solapamiento entre turnos para traspasar incidencias sin prisas.', en: 'On the packaging line we’d need 5 more minutes of shift overlap to hand over issues without rushing.' },
  'Molt bona iniciativa la revisió de calçat ergonòmic per a les jornades de peu continuades.': { es: 'Muy buena iniciativa la revisión de calzado ergonómico para las jornadas de pie continuadas.', en: 'Great initiative reviewing ergonomic footwear for long standing shifts.' },
  "Molt agraïts per les explicacions curtes d'arrencada de torn que fan els caps d'equip abans d'arrencar línies.": { es: 'Muy agradecidos por las explicaciones cortas de inicio de turno que hacen los jefes de equipo antes de arrancar líneas.', en: 'Very grateful for the short start-of-shift briefings team leads give before starting the lines.' },
  "Molt bon ambient i acollida als nous companys que s'han incorporat a la secció de cocció i filtració.": { es: 'Muy buen ambiente y acogida a los nuevos compañeros que se han incorporado a la sección de cocción y filtración.', en: 'Great atmosphere and welcome for the new colleagues who joined the brewing and filtration section.' },
  "La nova climatització a la sala d'envasat ha reduït notablement la calor als torns de tarda.": { es: 'La nueva climatización en la sala de envasado ha reducido notablemente el calor en los turnos de tarde.', en: 'The new air conditioning in the packaging hall has noticeably reduced the heat on afternoon shifts.' },
  "L'app interna de Damm Pulse funciona molt bé per consultar el menú de la cantina i les novetats corporatives.": { es: 'La app interna de Damm Pulse funciona muy bien para consultar el menú de la cantina y las novedades corporativas.', en: 'The internal Damm Pulse app works really well for checking the canteen menu and company news.' },
  "La iniciativa dels divendres de celebració d'equip fa que vingui molt de gust treballar junts a l'oficina.": { es: 'La iniciativa de los viernes de celebración de equipo hace que apetezca mucho trabajar juntos en la oficina.', en: 'The Friday team celebrations make working together at the office something to look forward to.' },
  'Caldria instal·lar un punt addicional de càrrega per a bicicletes i patinets al pàrquing subterrani.': { es: 'Habría que instalar un punto adicional de carga para bicicletas y patinetes en el parking subterráneo.', en: 'We should install an extra charging point for bikes and scooters in the underground car park.' },
  "La reducció de plàstic d'un sol ús a totes les plantes i oficines és un orgull per a la sostenibilitat de Damm.": { es: 'La reducción de plástico de un solo uso en todas las plantas y oficinas es un orgullo para la sostenibilidad de Damm.', en: 'Cutting single-use plastic across all plants and offices is something to be proud of for Damm’s sustainability.' },
  "Les noves ulleres protectores graduades són molt més còmodes i no s'entelen amb la calor de l'estiu.": { es: 'Las nuevas gafas protectoras graduadas son mucho más cómodas y no se empañan con el calor del verano.', en: 'The new prescription safety glasses are much more comfortable and don’t fog up in the summer heat.' },
  "Orgull de marca Estrella de Levante a la regió; l'ambient de fàbrica és proper i familiar.": { es: 'Orgullo de marca Estrella de Levante en la región; el ambiente de fábrica es cercano y familiar.', en: 'Proud of the Estrella de Levante brand in the region; the plant feels close-knit and friendly.' },
  "Els nous dispensadors d'aigua filtrada a la zona d'omplidores han estat una gran millora.": { es: 'Los nuevos dispensadores de agua filtrada en la zona de llenadoras han sido una gran mejora.', en: 'The new filtered water dispensers in the filler area have been a big improvement.' },
  'Valorem molt positivament la flexibilitat per canviar torns puntuals entre companys.': { es: 'Valoramos muy positivamente la flexibilidad para cambiar turnos puntuales entre compañeros.', en: 'We really value the flexibility to swap the odd shift with colleagues.' },
  'Molt bona reacció dels equips de prevenció davant la petita incidència al circuit de vapor.': { es: 'Muy buena reacción de los equipos de prevención ante la pequeña incidencia en el circuito de vapor.', en: 'Great response from the safety teams to the minor incident on the steam circuit.' },
  'Proposo fer un resum de 2 minuts de les millores de planta a les pantalles informatives de la cantina.': { es: 'Propongo hacer un resumen de 2 minutos de las mejoras de planta en las pantallas informativas de la cantina.', en: 'I suggest a 2-minute summary of plant improvements on the canteen info screens.' },
  "L'esperit d'equip a Victoria és immillorable; tothom rema en la mateixa direcció.": { es: 'El espíritu de equipo en Victoria es inmejorable; todos reman en la misma dirección.', en: 'Team spirit at Victoria couldn’t be better; everyone pulls in the same direction.' },
  'Molt ben valorades les visites guiades obertes per als familiars dels treballadors.': { es: 'Muy bien valoradas las visitas guiadas abiertas para los familiares de los trabajadores.', en: 'The open guided tours for employees’ families were very well received.' },
  "Les noves pauses escalonades han donat una mica d'aire fresc a la línia d'omplidores d'alta velocitat.": { es: 'Las nuevas pausas escalonadas han dado un poco de aire fresco a la línea de llenadoras de alta velocidad.', en: 'The new staggered breaks have brought some fresh air to the high-speed filler line.' },
  "Els nous protocols ergonòmics de paletitzat han reduït molt les molèsties d'esquena.": { es: 'Los nuevos protocolos ergonómicos de paletizado han reducido mucho las molestias de espalda.', en: 'The new ergonomic palletising protocols have greatly reduced back pain.' },
  "Molt bona il·luminació als nous molls d'expedició de comandes.": { es: 'Muy buena iluminación en los nuevos muelles de expedición de pedidos.', en: 'Great lighting at the new order dispatch docks.' },
  'La senyalització dels passos de vianants entre naus ha millorat notablement la seguretat dels operaris.': { es: 'La señalización de los pasos de peatones entre naves ha mejorado notablemente la seguridad de los operarios.', en: 'Marking the pedestrian crossings between buildings has noticeably improved operator safety.' },
  "Molt bona col·laboració entre els torns de matí i tarda durant la campanya d'estiu.": { es: 'Muy buena colaboración entre los turnos de mañana y tarde durante la campaña de verano.', en: 'Great collaboration between morning and afternoon shifts during the summer season.' },
  'La renovació dels vestuaris de planta ha quedat excel·lent, molt més còmodes i nets.': { es: 'La renovación de los vestuarios de planta ha quedado excelente, mucho más cómodos y limpios.', en: 'The plant changing-room refurbishment turned out excellent: far more comfortable and clean.' },
  'Excelente integração da equipa local com os novos processos e sistemas corporativos Damm.': { es: 'Excelente integración del equipo local con los nuevos procesos y sistemas corporativos de Damm.', en: 'Excellent integration of the local team with Damm’s new corporate processes and systems.' },
  'As novas formações práticas de segurança no trabalho foram muito claras e participativas.': { es: 'Las nuevas formaciones prácticas de seguridad en el trabajo fueron muy claras y participativas.', en: 'The new hands-on workplace safety trainings were very clear and interactive.' },
  'A aplicação Damm Pulse com opção de idioma facilita imenso o acompanhamento diário.': { es: 'La aplicación Damm Pulse con opción de idioma facilita muchísimo el seguimiento diario.', en: 'The Damm Pulse app with language options makes day-to-day follow-up so much easier.' },
  "L'esperit d'equip a malteria és excel·lent, tothom dona un cop de mà quan hi ha pics d'arribada d'ordi.": { es: 'El espíritu de equipo en la maltería es excelente, todos echan una mano cuando hay picos de llegada de cebada.', en: 'Team spirit at the malting plant is excellent; everyone lends a hand when barley deliveries peak.' },
  'Molt recomanable la formació pràctica de tast de malta i matèries primeres que vam fer.': { es: 'Muy recomendable la formación práctica de cata de malta y materias primas que hicimos.', en: 'The hands-on malt and raw-material tasting training we did is highly recommended.' },
  'Els nous detectors de pols a les tremuges de descàrrega funcionen de manera impecable.': { es: 'Los nuevos detectores de polvo en las tolvas de descarga funcionan de manera impecable.', en: 'The new dust detectors on the unloading hoppers work flawlessly.' },
  'Els canals digitals han fet molt més fàcil seguir les novetats sense dependre de taulers de paper.': { es: 'Los canales digitales han hecho mucho más fácil seguir las novedades sin depender de tablones de papel.', en: 'Digital channels have made it much easier to follow news without relying on paper noticeboards.' },
  'Orgull de produir una marca tan històrica i estimada; la cohesió a línia és molt forta.': { es: 'Orgullo de producir una marca tan histórica y querida; la cohesión en línea es muy fuerte.', en: 'Proud to produce such a historic, well-loved brand; cohesion on the line is very strong.' },
  'La nova maquinària de final de línia ha eliminat moltes càrregues manuals feixugues.': { es: 'La nueva maquinaria de final de línea ha eliminado muchas cargas manuales pesadas.', en: 'The new end-of-line machinery has removed a lot of heavy manual lifting.' },
  'Molt bon clima de treball a torrefacció i envasat de cafè; es treballa amb molta cura.': { es: 'Muy buen clima de trabajo en tostado y envasado de café; se trabaja con mucho cuidado.', en: 'Great working climate in coffee roasting and packing; people work with real care.' },
  "Molt ben senyalitzat l'espai de maniobra per a camions i càrrega de palets.": { es: 'Muy bien señalizado el espacio de maniobra para camiones y carga de palés.', en: 'The manoeuvring area for trucks and pallet loading is very well marked.' },
  'La nova gamma de càpsules compostables és un gran pas per a la nostra sostenibilitat.': { es: 'La nueva gama de cápsulas compostables es un gran paso para nuestra sostenibilidad.', en: 'The new range of compostable capsules is a big step for our sustainability.' },
  "Els accessos a la captació d'aigua i a les línies d'embotellat compleixen els estàndards més alts.": { es: 'Los accesos a la captación de agua y a las líneas de embotellado cumplen los estándares más altos.', en: 'Access to the water intake and bottling lines meets the highest standards.' },
  'Equip petit però molt cohesionat; la flexibilitat i suport mutu són constants.': { es: 'Equipo pequeño pero muy cohesionado; la flexibilidad y el apoyo mutuo son constantes.', en: 'Small but very close-knit team; flexibility and mutual support are constant.' },
  'El compromís amb el Parc Natural de Posets-Maladeta és un referent per a tota la plantilla.': { es: 'El compromiso con el Parque Natural de Posets-Maladeta es un referente para toda la plantilla.', en: 'Our commitment to the Posets-Maladeta Natural Park is a benchmark for the whole workforce.' },
  "Les noves baranes i passarel·les a la nau d'envasat donen molta més tranquil·litat.": { es: 'Las nuevas barandillas y pasarelas en la nave de envasado dan mucha más tranquilidad.', en: 'The new railings and walkways in the packaging building give much more peace of mind.' },
  'Molt bona entesa amb els responsables de torn i comunicació diària directa i transparent.': { es: 'Muy buen entendimiento con los responsables de turno y comunicación diaria directa y transparente.', en: 'Great rapport with shift leads and direct, transparent daily communication.' },
  'La nova il·luminació a la zona de magatzem de palets ha quedat molt neta i clara.': { es: 'La nueva iluminación en la zona de almacén de palés ha quedado muy limpia y clara.', en: 'The new lighting in the pallet warehouse area is very clean and bright.' },
  'Al moll de càrrega els divendres a la tarda tenim pics molt forts; reforçar el torn evitaria retards.': { es: 'En el muelle de carga los viernes por la tarde tenemos picos muy fuertes; reforzar el turno evitaría retrasos.', en: 'Friday afternoons at the loading dock get very busy; adding staff to the shift would avoid delays.' },
  'La separació física entre camions i carretons al pati exterior ha evitat molts ensurts.': { es: 'La separación física entre camiones y carretillas en el patio exterior ha evitado muchos sustos.', en: 'Physically separating trucks and forklifts in the yard has prevented many close calls.' },
  "La nova pantalla de l'estat de molls en temps real ha agilitzat molt la feina dels mossos.": { es: 'La nueva pantalla del estado de los muelles en tiempo real ha agilizado mucho el trabajo de los mozos.', en: 'The new real-time dock status screen has really sped up the warehouse team’s work.' },
  'Molt bon companyerisme entre els xofers de repartiment i l\'equip de preparació de rutes.': { es: 'Muy buen compañerismo entre los chóferes de reparto y el equipo de preparación de rutas.', en: 'Great camaraderie between delivery drivers and the route-planning team.' },
  'Els nous llums LED al magatzem han millorat la visibilitat als passadissos alts.': { es: 'Las nuevas luces LED en el almacén han mejorado la visibilidad en los pasillos altos.', en: 'The new LED lights in the warehouse have improved visibility in the high aisles.' },
  'Els nous miralls panoràmics als encreuaments de magatzem han estat una mesura clau.': { es: 'Los nuevos espejos panorámicos en los cruces del almacén han sido una medida clave.', en: 'The new panoramic mirrors at warehouse crossings have been a key measure.' },
  "Excel·lent relació amb l'equip de trànsit i coordinació fluida en dies de gran volum.": { es: 'Excelente relación con el equipo de tráfico y coordinación fluida en días de gran volumen.', en: 'Excellent relationship with the traffic team and smooth coordination on high-volume days.' },
}

export function demoText(text: string | null | undefined, lang: Lang): string {
  if (!text) return text ?? ''
  if (lang === 'ca') return text
  return DEMO[text.trim()]?.[lang] ?? text
}

/** `const dx = useDemoText()` → `dx(survey.title)` */
export function useDemoText() {
  const { lang } = useI18n()
  return useCallback((text: string | null | undefined) => demoText(text, lang), [lang])
}

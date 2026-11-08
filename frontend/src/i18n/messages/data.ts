import type { Messages } from '..'

/**
 * Etiquetes d'enumeracions de src/data/mock.ts (estats d'ànim i canals).
 * Ús: t(`data.mood_${mood}`), t(`data.channel_${key}`), t(`data.channelSub_${key}`).
 * El contingut de demo (històries de zones, preguntes, comentaris) es manté en l'idioma original.
 */
const m: Messages = {
  ca: {
    mood_happy: 'Content', mood_uneasy: 'Inquiet', mood_stressed: 'Estressat', mood_nodata: 'Sense dades', mood_lock: 'En obres',
    channel_qr: 'QR a planta', channel_app: 'Notificació a l’app', channel_teams: 'Microsoft Teams', channel_email: 'Correu', channel_placa: 'La Plaça', channel_world: 'Damm World', channel_whatsapp: 'Grup de WhatsApp', channel_telegram: 'Telegram', channel_tablet: 'Tauleta al menjador',
    channelSub_qr: 'Cartells a línies, vestidors i menjador', channelSub_app: 'Avís al mòbil de qui la té instal·lada', channelSub_teams: 'Canal corporatiu d’equips i xat intern', channelSub_email: 'Per a oficines i comercial', channelSub_placa: 'Parada de l’enquesta destacada', channelSub_world: 'Apareix com a missió de l’equip',
  },
  es: {
    mood_happy: 'Contento', mood_uneasy: 'Inquieto', mood_stressed: 'Estresado', mood_nodata: 'Sin datos', mood_lock: 'En obras',
    channel_qr: 'QR en planta', channel_app: 'Notificación en la app', channel_teams: 'Microsoft Teams', channel_email: 'Correo', channel_placa: 'La Plaça', channel_world: 'Damm World', channel_whatsapp: 'Grupo de WhatsApp', channel_telegram: 'Telegram', channel_tablet: 'Tableta en el comedor',
    channelSub_qr: 'Carteles en líneas, vestuarios y comedor', channelSub_app: 'Aviso en el móvil de quien la tiene instalada', channelSub_teams: 'Canal corporativo de equipos y chat interno', channelSub_email: 'Para oficinas y comercial', channelSub_placa: 'Parada de la encuesta destacada', channelSub_world: 'Aparece como misión del equipo',
  },
  en: {
    mood_happy: 'Happy', mood_uneasy: 'Uneasy', mood_stressed: 'Stressed', mood_nodata: 'No data', mood_lock: 'Under construction',
    channel_qr: 'QR on site', channel_app: 'App notification', channel_teams: 'Microsoft Teams', channel_email: 'Email', channel_placa: 'La Plaça', channel_world: 'Damm World', channel_whatsapp: 'WhatsApp group', channel_telegram: 'Telegram', channel_tablet: 'Canteen tablet',
    channelSub_qr: 'Posters on lines, locker rooms and canteen', channelSub_app: 'Mobile alert for those who have it installed', channelSub_teams: 'Corporate team channel and internal chat', channelSub_email: 'For offices and sales', channelSub_placa: 'Featured survey stop', channelSub_world: 'Shows up as a team mission',
  },
}
export default m

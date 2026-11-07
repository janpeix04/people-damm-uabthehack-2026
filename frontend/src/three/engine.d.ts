export interface AvatarColors {
  skin: string
  hair: string
  shirt: string
  style: number
  logo: boolean
}

export interface ZonePin {
  key: string
  name: string
  score: string
  moodLabel: string
  bg: string
  ink: string
  path: string
}

export interface MountOptions {
  ariaLabel?: string
  avatar?: AvatarColors
  surveyTag?: string
  zones?: ZonePin[]
  initialZone?: string
  onAction?: (action: 'survey' | 'idea' | 'stage') => void
  onZone?: (zone: string) => void
  /** Plaça: % de participació setmanal (activa garlandes, bancs, concert i focs). Per defecte, 100. */
  festa?: number
  /** Plaça: índexs de les bafarades on aquesta persona ja ha fet +1 aquesta setmana. */
  reacted?: number[]
  /** Plaça: s'ha fet (o desfet) +1 en una bafarada. */
  onReact?: (index: number, on: boolean) => void
  /** Plaça: vista de només lectura (RRHH), sense botons de +1. */
  readOnly?: boolean
}

export interface SceneHandle {
  burst(): void
  setFesta(pct: number): void
  setAvatar(a: AvatarColors): void
  select(zone: string): void
  dispose(): void
}

export function mountScene(container: HTMLElement, kind: 'plaza' | 'world', opts?: MountOptions): SceneHandle
export function webglAvailable(): boolean

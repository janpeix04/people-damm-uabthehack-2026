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
  weatherLabel: string
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
}

export interface SceneHandle {
  burst(): void
  setAvatar(a: AvatarColors): void
  select(zone: string): void
  dispose(): void
}

export function mountScene(container: HTMLElement, kind: 'plaza' | 'world', opts?: MountOptions): SceneHandle
export function webglAvailable(): boolean

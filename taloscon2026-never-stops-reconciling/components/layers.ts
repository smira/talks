// Talos v0.8 boot sequence grouped into layers, inner to outer.
// Phase names are from the v0.8 sequencer.
export const CX = 180
export const CY = 172

export interface Layer {
  label: string
  r: number
  color: string
  phases: string[]
  note?: string
}

export const layers: Layer[] = [
  { label: 'kernel', r: 38, color: '#e92582', phases: ['systemRequirements', 'integrity'] },
  { label: 'network', r: 58, color: '#b8307f', phases: ['discoverNetwork', 'setupNetwork'] },
  { label: 'config', r: 78, color: '#723a8b', phases: ['config', 'mountState', 'saveConfig'] },
  { label: 'containerd', r: 98, color: '#3d4390', phases: ['env', 'containerd'] },
  { label: 'disks', r: 118, color: '#074c94', phases: ['ephemeral', 'var', 'overlay', 'udevd', 'userDisks', 'lvm'] },
  { label: 'services', r: 138, color: '#1f6f91', phases: ['startEverything'], note: 'etcd, kubelet, bootkube…' },
  { label: 'Kubernetes', r: 158, color: '#2a8a6e', phases: ['labelMaster', 'uncordon'] },
]

// y coordinate of a layer's label: top of its band, or the center for the core.
export function labelY(i: number): number {
  if (i === 0)
    return CY + 5
  return CY - (layers[i - 1].r + layers[i].r) / 2 + 4
}

// Point in the middle of a layer's band at the given angle (degrees, 0 = right, clockwise).
export function bandPoint(i: number, deg: number): [number, number] {
  const rb = i === 0 ? layers[0].r / 2 : (layers[i - 1].r + layers[i].r) / 2
  const a = (deg * Math.PI) / 180
  return [CX + rb * Math.cos(a), CY + rb * Math.sin(a)]
}

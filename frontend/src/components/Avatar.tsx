import { useEffect, useState } from 'react'
import { avatarUrl } from '../api/client'
import { initials } from '../lib/format'

/** Profile picture, or initials on surface-2 when there is none (or it can't be loaded). */
export function Avatar({ id, name, version, size = 36 }: {
  id: string
  name: string
  version: number | null
  size?: number
}) {
  const [loaded, setLoaded] = useState<{ key: string; url: string } | null>(null)
  const key = `${id}:${version}`

  useEffect(() => {
    if (version == null) return
    let live = true
    avatarUrl(id, version).then((url) => live && setLoaded({ key, url })).catch(() => {})
    return () => { live = false }
  }, [id, version, key])

  const url = loaded?.key === key ? loaded.url : null
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 font-bold"
      style={{ width: size, height: size, fontSize: Math.round(size / 3) }}>
      {url ? <img src={url} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  )
}

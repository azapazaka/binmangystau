// src/components/maps/CityMap.tsx
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { env } from '@/lib/env'
import { CATEGORY_META } from '@/lib/constants'
import type { ClusterRecord } from '@/types'

type Props = {
  clusters: ClusterRecord[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  height?: string
}

export function CityMap({ clusters, selectedId, onSelect, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    mapboxgl.accessToken = env.mapboxToken || 'pk.placeholder'

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [env.defaultLng, env.defaultLat],
      zoom: 11,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    return () => { map.remove() }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    clusters.forEach(c => {
      const color = CATEGORY_META[c.category]?.color ?? '#94a3b8'
      const el = document.createElement('div')
      el.style.cssText = `
        width:36px; height:36px; border-radius:50%;
        background:${color}; border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,.25);
        display:flex; align-items:center; justify-content:center;
        color:white; font-size:11px; font-weight:700;
        cursor:pointer; transition:transform 0.15s;
        ${c.id === selectedId ? 'transform:scale(1.25);' : ''}
      `
      el.textContent = String(c.reportCount)
      el.addEventListener('click', () => onSelect?.(c.id))

      const marker = new mapboxgl.Marker(el)
        .setLngLat([c.lng, c.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }, [clusters, selectedId, onSelect])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

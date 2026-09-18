import { useState, useEffect, useRef } from 'react'

// IndexedDB utility for caching video thumbnails
const DB_NAME = 'video-thumbnails'
const DB_VERSION = 1
const STORE_NAME = 'thumbnails'

interface ThumbnailCache {
  videoUrl: string
  thumbnail: Blob
  timestamp: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'videoUrl' })
      }
    }
  })

  return dbPromise
}

async function getThumbnailFromCache(videoUrl: string): Promise<string | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(videoUrl)
      request.onsuccess = () => {
        const result = request.result as ThumbnailCache | undefined
        if (result?.thumbnail) {
          resolve(URL.createObjectURL(result.thumbnail))
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting thumbnail from cache:', error)
    return null
  }
}

async function saveThumbnailToCache(videoUrl: string, thumbnail: Blob): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const data: ThumbnailCache = {
      videoUrl,
      thumbnail,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error saving thumbnail to cache:', error)
  }
}

async function generateThumbnail(videoUrl: string, seekTime: number = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    video.onloadedmetadata = () => {
      // Seek to the desired timestamp (or adjust if video is shorter)
      const actualSeekTime = Math.min(seekTime, video.duration * 0.1)
      video.currentTime = actualSeekTime
    }

    video.onseeked = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
          // Cleanup
          video.src = ''
          video.load()
        },
        'image/jpeg',
        0.8
      )
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      video.src = ''
      video.load()
    }

    video.src = videoUrl
  })
}

interface VideoThumbnailProps {
  videoUrl: string
  alt?: string
  style?: React.CSSProperties
  className?: string
  seekTime?: number
}

export function VideoThumbnail({ videoUrl, alt = 'Video thumbnail', style, className, seekTime = 1 }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let objectUrl: string | null = null

    async function loadThumbnail() {
      if (!videoUrl) return

      setIsGenerating(true)
      setError(false)

      try {
        // Check cache first
        const cachedUrl = await getThumbnailFromCache(videoUrl)
        if (cachedUrl && mountedRef.current) {
          setThumbnailUrl(cachedUrl)
          objectUrl = cachedUrl
          setIsGenerating(false)
          return
        }

        // Generate new thumbnail
        const blob = await generateThumbnail(videoUrl, seekTime)

        if (!mountedRef.current) return

        // Save to cache
        await saveThumbnailToCache(videoUrl, blob)

        // Create object URL and set it
        const url = URL.createObjectURL(blob)
        objectUrl = url
        setThumbnailUrl(url)
      } catch (err) {
        console.error('Failed to generate video thumbnail:', err)
        if (mountedRef.current) {
          setError(true)
        }
      } finally {
        if (mountedRef.current) {
          setIsGenerating(false)
        }
      }
    }

    loadThumbnail()

    // Cleanup object URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [videoUrl, seekTime])

  if (error) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#666',
        }}
        className={className}
      >
        Video unavailable
      </div>
    )
  }

  if (isGenerating || !thumbnailUrl) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
        }}
        className={className}
      >
        {/* Loading placeholder */}
      </div>
    )
  }

  return (
    <img
      src={thumbnailUrl}
      alt={alt}
      loading="lazy"
      style={style}
      className={className}
    />
  )
}

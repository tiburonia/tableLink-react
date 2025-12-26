import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface FeedPost {
  id: number
  author: string
  avatar: string
  image: string | null
  caption: string
  date: string
  likes: number
  type: 'story' | 'promotion' | 'notice'
  isLiked: boolean
  title: string
  tags: string[]
}

interface StoreInfo {
  id: number
  name: string
  logo: string
  bio: string
  followers: number
  isFollowing: boolean
}

interface UseStoreFeedReturn {
  store: StoreInfo | null
  posts: FeedPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  toggleLike: (postId: number) => void
  goBack: () => void
}

export const useStoreFeed = (storeId: string | undefined): UseStoreFeedReturn => {
  const navigate = useNavigate()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  const fetchFeeds = useCallback(async (isInitial = false) => {
    if (!storeId) return

    try {
      if (isInitial) {
        setLoading(true)
        setOffset(0)
      }

      const currentOffset = isInitial ? 0 : offset
      const response = await fetch(`/api/store-feeds/${storeId}?limit=${limit}&offset=${currentOffset}`)
      
      if (!response.ok) {
        throw new Error('피드를 불러오는데 실패했습니다')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '피드를 불러오는데 실패했습니다')
      }

      if (isInitial) {
        setStore(data.store)
        setPosts(data.posts)
      } else {
        setPosts(prev => [...prev, ...data.posts])
      }

      setHasMore(data.posts.length >= limit)
      setOffset(currentOffset + data.posts.length)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [storeId, offset])

  useEffect(() => {
    fetchFeeds(true)
  }, [storeId])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchFeeds(false)
    }
  }, [loading, hasMore, fetchFeeds])

  const toggleLike = useCallback((postId: number) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    )
  }, [])

  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  return {
    store,
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    toggleLike,
    goBack,
  }
}

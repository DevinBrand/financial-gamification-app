// src/stores/profile.ts - Comprehensive Social Media Profile Store
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { apiClient } from '@/services/api/client'
import { useAuthStore } from './auth'
import type {
  UserProfile,
  ProfileUpdate,
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  Follow,
  FriendRequest,
  Friendship,
  Notification,
  Activity,
  Badge,
  Achievement,
  SearchFilters,
  SearchResults,
  ImageUploadRequest,
  ImageUploadResponse,
  ProfileActionResult,
  PaginatedResponse,
  UserList,
  ConnectionStats,
  ReportRequest,
  NotificationType,
  EngagementAction,
  ConnectionAction
} from '@/types/profiles.types'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  
  // State
  const currentProfile = ref<UserProfile | null>(null)
  const viewedProfile = ref<UserProfile | null>(null)
  const posts = ref<Post[]>([])
  const timeline = ref<Post[]>([])
  const notifications = ref<Notification[]>([])
  const activities = ref<Activity[]>([])
  const followers = ref<UserProfile[]>([])
  const following = ref<UserProfile[]>([])
  const friends = ref<UserProfile[]>([])
  const friendRequests = ref<FriendRequest[]>([])
  const badges = ref<Badge[]>([])
  const achievements = ref<Achievement[]>([])
  
  // Loading states
  const isLoading = ref(false)
  const isUploadingImage = ref(false)
  const isPostingContent = ref(false)
  
  // Pagination
  const currentPage = ref(1)
  const hasMorePosts = ref(true)
  const hasMoreTimeline = ref(true)
  
  // Computed
  const isOwnProfile = computed(() => 
    currentProfile.value?.userId === authStore.user?.id
  )
  
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.isRead).length
  )
  
  const pendingFriendRequests = computed(() =>
    friendRequests.value.filter(req => req.status === 'pending' && req.receiverId === authStore.user?.id)
  )
  
  const socialStats = computed(() => {
    if (!currentProfile.value) return null
    return {
      followers: currentProfile.value.followersCount,
      following: currentProfile.value.followingCount,
      friends: currentProfile.value.friendsCount,
      posts: currentProfile.value.postsCount,
      level: currentProfile.value.level,
      points: currentProfile.value.points
    }
  })

  // Profile Management
  async function fetchProfile(userId?: string): Promise<ProfileActionResult<UserProfile>> {
    isLoading.value = true
    try {
      const targetUserId = userId || authStore.user?.id
      if (!targetUserId) {
        throw new Error('No user ID provided')
      }

      const response = await apiClient.get<UserProfile>(`/profiles/${targetUserId}`)
      
      if (userId && userId !== authStore.user?.id) {
        viewedProfile.value = response.data
      } else {
        currentProfile.value = response.data
      }
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(updates: ProfileUpdate): Promise<ProfileActionResult<UserProfile>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    isLoading.value = true
    try {
      const response = await apiClient.patch<UserProfile>(`/profiles/${authStore.user.id}`, updates)
      
      if (currentProfile.value) {
        currentProfile.value = { ...currentProfile.value, ...response.data }
      }
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  async function uploadAvatar(imageRequest: ImageUploadRequest): Promise<ProfileActionResult<ImageUploadResponse>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    isUploadingImage.value = true
    try {
      const response = await apiClient.upload<ImageUploadResponse>(
        `/profiles/${authStore.user.id}/avatar`,
        imageRequest.file,
        {
          additionalData: {
            cropData: imageRequest.cropData ? JSON.stringify(imageRequest.cropData) : undefined
          }
        }
      )
      
      if (response.data.success && response.data.url && currentProfile.value) {
        currentProfile.value.avatar = response.data.url
      }
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isUploadingImage.value = false
    }
  }

  async function uploadCoverImage(imageRequest: ImageUploadRequest): Promise<ProfileActionResult<ImageUploadResponse>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    isUploadingImage.value = true
    try {
      const response = await apiClient.upload<ImageUploadResponse>(
        `/profiles/${authStore.user.id}/cover`,
        imageRequest.file,
        {
          additionalData: {
            cropData: imageRequest.cropData ? JSON.stringify(imageRequest.cropData) : undefined
          }
        }
      )
      
      if (response.data.success && response.data.url && currentProfile.value) {
        currentProfile.value.coverImage = response.data.url
      }
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isUploadingImage.value = false
    }
  }

  // Posts Management
  async function fetchPosts(userId?: string, page = 1): Promise<ProfileActionResult<PaginatedResponse<Post>>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<PaginatedResponse<Post>>(`/posts/user/${targetUserId}?page=${page}&limit=20`)
      
      if (page === 1) {
        posts.value = response.data.items
      } else {
        posts.value.push(...response.data.items)
      }
      
      hasMorePosts.value = response.data.hasMore
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchTimeline(page = 1): Promise<ProfileActionResult<PaginatedResponse<Post>>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Post>>(`/posts/timeline?page=${page}&limit=20`)
      
      if (page === 1) {
        timeline.value = response.data.items
      } else {
        timeline.value.push(...response.data.items)
      }
      
      hasMoreTimeline.value = response.data.hasMore
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function createPost(postData: CreatePostRequest): Promise<ProfileActionResult<Post>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    isPostingContent.value = true
    try {
      let response: { data: Post }

      if (postData.images && postData.images.length > 0) {
        // Upload post with images
        const formData = new FormData()
        formData.append('content', postData.content)
        formData.append('type', postData.type || 'image')
        formData.append('visibility', postData.visibility || 'public')
        
        postData.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })

        response = await apiClient.instance.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Text-only post
        response = await apiClient.post<Post>('/posts', {
          content: postData.content,
          type: postData.type || 'text',
          visibility: postData.visibility || 'public'
        })
      }
      
      // Add to beginning of posts array
      posts.value.unshift(response.data)
      timeline.value.unshift(response.data)
      
      // Update post count
      if (currentProfile.value) {
        currentProfile.value.postsCount++
      }
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isPostingContent.value = false
    }
  }

  async function updatePost(postId: string, updates: UpdatePostRequest): Promise<ProfileActionResult<Post>> {
    try {
      const response = await apiClient.patch<Post>(`/posts/${postId}`, updates)
      
      // Update in both arrays
      const updatePostInArray = (postArray: Post[]) => {
        const index = postArray.findIndex(p => p.id === postId)
        if (index !== -1) {
          postArray[index] = { ...postArray[index], ...response.data }
        }
      }
      
      updatePostInArray(posts.value)
      updatePostInArray(timeline.value)
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function deletePost(postId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/posts/${postId}`)
      
      // Remove from both arrays
      posts.value = posts.value.filter(p => p.id !== postId)
      timeline.value = timeline.value.filter(p => p.id !== postId)
      
      // Update post count
      if (currentProfile.value) {
        currentProfile.value.postsCount--
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function likePost(postId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/posts/${postId}/like`)
      
      // Update post in both arrays
      const updatePostLike = (postArray: Post[]) => {
        const post = postArray.find(p => p.id === postId)
        if (post) {
          post.isLiked = true
          post.likesCount++
        }
      }
      
      updatePostLike(posts.value)
      updatePostLike(timeline.value)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function unlikePost(postId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/posts/${postId}/like`)
      
      // Update post in both arrays
      const updatePostUnlike = (postArray: Post[]) => {
        const post = postArray.find(p => p.id === postId)
        if (post) {
          post.isLiked = false
          post.likesCount--
        }
      }
      
      updatePostUnlike(posts.value)
      updatePostUnlike(timeline.value)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Comments Management
  async function fetchComments(postId: string): Promise<ProfileActionResult<Comment[]>> {
    try {
      const response = await apiClient.get<Comment[]>(`/posts/${postId}/comments`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function createComment(commentData: CreateCommentRequest): Promise<ProfileActionResult<Comment>> {
    try {
      const response = await apiClient.post<Comment>('/comments', commentData)
      
      // Update comment count in posts
      const updateCommentCount = (postArray: Post[]) => {
        const post = postArray.find(p => p.id === commentData.postId)
        if (post) {
          post.commentsCount++
        }
      }
      
      updateCommentCount(posts.value)
      updateCommentCount(timeline.value)
      
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function updateComment(commentId: string, updates: UpdateCommentRequest): Promise<ProfileActionResult<Comment>> {
    try {
      const response = await apiClient.patch<Comment>(`/comments/${commentId}`, updates)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function deleteComment(commentId: string, postId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/comments/${commentId}`)
      
      // Update comment count in posts
      const updateCommentCount = (postArray: Post[]) => {
        const post = postArray.find(p => p.id === postId)
        if (post) {
          post.commentsCount--
        }
      }
      
      updateCommentCount(posts.value)
      updateCommentCount(timeline.value)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function likeComment(commentId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/comments/${commentId}/like`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function unlikeComment(commentId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/comments/${commentId}/like`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Following System
  async function followUser(userId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/users/${userId}/follow`)
      
      // Update profile states
      if (viewedProfile.value?.userId === userId) {
        viewedProfile.value.isFollowing = true
        viewedProfile.value.followersCount++
      }
      
      if (currentProfile.value) {
        currentProfile.value.followingCount++
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function unfollowUser(userId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/users/${userId}/follow`)
      
      // Update profile states
      if (viewedProfile.value?.userId === userId) {
        viewedProfile.value.isFollowing = false
        viewedProfile.value.followersCount--
      }
      
      if (currentProfile.value) {
        currentProfile.value.followingCount--
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchFollowers(userId?: string): Promise<ProfileActionResult<UserProfile[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<UserProfile[]>(`/users/${targetUserId}/followers`)
      followers.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchFollowing(userId?: string): Promise<ProfileActionResult<UserProfile[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<UserProfile[]>(`/users/${targetUserId}/following`)
      following.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Friends System
  async function sendFriendRequest(userId: string, message?: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/users/${userId}/friend-request`, { message })
      
      if (viewedProfile.value?.userId === userId) {
        viewedProfile.value.friendRequestStatus = 'pending'
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function acceptFriendRequest(requestId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/friend-requests/${requestId}/accept`)
      
      // Update friend request status
      const request = friendRequests.value.find(r => r.id === requestId)
      if (request) {
        request.status = 'accepted'
        
        // Update friend counts
        if (currentProfile.value) {
          currentProfile.value.friendsCount++
        }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function rejectFriendRequest(requestId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.post(`/friend-requests/${requestId}/reject`)
      
      const request = friendRequests.value.find(r => r.id === requestId)
      if (request) {
        request.status = 'rejected'
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function removeFriend(userId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete(`/users/${userId}/friend`)
      
      // Update friend status
      if (viewedProfile.value?.userId === userId) {
        viewedProfile.value.isFriend = false
        viewedProfile.value.friendRequestStatus = undefined
      }
      
      // Update friend counts
      if (currentProfile.value) {
        currentProfile.value.friendsCount--
      }
      
      // Remove from friends array
      friends.value = friends.value.filter(friend => friend.userId !== userId)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchFriends(userId?: string): Promise<ProfileActionResult<UserProfile[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<UserProfile[]>(`/users/${targetUserId}/friends`)
      friends.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchFriendRequests(): Promise<ProfileActionResult<FriendRequest[]>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const response = await apiClient.get<FriendRequest[]>('/friend-requests')
      friendRequests.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Notifications
  async function fetchNotifications(): Promise<ProfileActionResult<Notification[]>> {
    if (!authStore.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const response = await apiClient.get<Notification[]>('/notifications')
      notifications.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function markNotificationRead(notificationId: string): Promise<ProfileActionResult> {
    try {
      await apiClient.patch(`/notifications/${notificationId}`, { isRead: true })
      
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function markAllNotificationsRead(): Promise<ProfileActionResult> {
    try {
      await apiClient.patch('/notifications/mark-all-read')
      
      notifications.value.forEach(notification => {
        notification.isRead = true
      })
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Search and Discovery
  async function searchUsers(filters: SearchFilters): Promise<ProfileActionResult<SearchResults<UserProfile>>> {
    try {
      const response = await apiClient.post<SearchResults<UserProfile>>('/search/users', filters)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function searchPosts(filters: SearchFilters): Promise<ProfileActionResult<SearchResults<Post>>> {
    try {
      const response = await apiClient.post<SearchResults<Post>>('/search/posts', filters)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Activity Feed
  async function fetchActivity(userId?: string): Promise<ProfileActionResult<Activity[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<Activity[]>(`/users/${targetUserId}/activity`)
      activities.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Gamification
  async function fetchBadges(userId?: string): Promise<ProfileActionResult<Badge[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<Badge[]>(`/users/${targetUserId}/badges`)
      badges.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async function fetchAchievements(userId?: string): Promise<ProfileActionResult<Achievement[]>> {
    const targetUserId = userId || authStore.user?.id
    if (!targetUserId) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const response = await apiClient.get<Achievement[]>(`/users/${targetUserId}/achievements`)
      achievements.value = response.data
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Reporting
  async function reportContent(reportData: ReportRequest): Promise<ProfileActionResult> {
    try {
      await apiClient.post('/reports', reportData)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Utility functions
  function clearViewedProfile() {
    viewedProfile.value = null
  }

  function clearPosts() {
    posts.value = []
    currentPage.value = 1
    hasMorePosts.value = true
  }

  function clearTimeline() {
    timeline.value = []
    hasMoreTimeline.value = true
  }

  // Watch for auth changes to clear data
  watch(() => authStore.user, (newUser) => {
    if (!newUser) {
      // Clear all data when user logs out
      currentProfile.value = null
      viewedProfile.value = null
      posts.value = []
      timeline.value = []
      notifications.value = []
      activities.value = []
      followers.value = []
      following.value = []
      friends.value = []
      friendRequests.value = []
      badges.value = []
      achievements.value = []
    } else if (newUser.id) {
      // Load profile when user logs in
      fetchProfile(newUser.id)
    }
  })

  return {
    // State
    currentProfile,
    viewedProfile,
    posts,
    timeline,
    notifications,
    activities,
    followers,
    following,
    friends,
    friendRequests,
    badges,
    achievements,
    
    // Loading states
    isLoading,
    isUploadingImage,
    isPostingContent,
    
    // Pagination
    hasMorePosts,
    hasMoreTimeline,
    
    // Computed
    isOwnProfile,
    unreadNotifications,
    pendingFriendRequests,
    socialStats,
    
    // Profile methods
    fetchProfile,
    updateProfile,
    uploadAvatar,
    uploadCoverImage,
    
    // Posts methods
    fetchPosts,
    fetchTimeline,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    
    // Comments methods
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    
    // Following methods
    followUser,
    unfollowUser,
    fetchFollowers,
    fetchFollowing,
    
    // Friends methods
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    fetchFriends,
    fetchFriendRequests,
    
    // Notifications methods
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    
    // Search methods
    searchUsers,
    searchPosts,
    
    // Activity methods
    fetchActivity,
    
    // Gamification methods
    fetchBadges,
    fetchAchievements,
    
    // Reporting methods
    reportContent,
    
    // Utility methods
    clearViewedProfile,
    clearPosts,
    clearTimeline,
  }
})
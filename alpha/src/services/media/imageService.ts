// src/services/media/imageService.ts - Avatar and Image Management Service
import { apiClient } from '@/services/api/client'
import type {
  ImageUploadRequest,
  ImageUploadResponse,
  ProfileActionResult
} from '@/types/profiles.types'

// Image compression and processing utilities
class ImageProcessor {
  // Compress image file
  static async compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Create avatar crop (square)
  static async cropToSquare(file: File, size = 400): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const { width, height } = img
        const minDimension = Math.min(width, height)
        
        canvas.width = size
        canvas.height = size
        
        // Calculate crop position (center crop)
        const startX = (width - minDimension) / 2
        const startY = (height - minDimension) / 2
        
        // Draw cropped and resized image
        ctx.drawImage(
          img,
          startX, startY, minDimension, minDimension,
          0, 0, size, size
        )
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(croppedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.9)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Custom crop with specified coordinates
  static async cropImage(file: File, cropData: {
    x: number
    y: number
    width: number
    height: number
  }, outputWidth = 400, outputHeight = 400): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        canvas.width = outputWidth
        canvas.height = outputHeight
        
        // Draw cropped image
        ctx.drawImage(
          img,
          cropData.x, cropData.y, cropData.width, cropData.height,
          0, 0, outputWidth, outputHeight
        )
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(croppedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.9)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Validate image file
  static validateImage(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Only JPEG, PNG, and WebP images are allowed' 
      }
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: 'Image size must be less than 10MB' 
      }
    }

    return { isValid: true }
  }

  // Get image dimensions
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Generate thumbnail
  static async generateThumbnail(file: File, size = 150): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(size / width, size / height)
        const newWidth = width * ratio
        const newHeight = height * ratio
        
        canvas.width = newWidth
        canvas.height = newHeight
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(thumbnailFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.8)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }
}

// Main Image Service
class ImageService {
  // Upload avatar with automatic processing
  async uploadAvatar(file: File, cropData?: {
    x: number
    y: number
    width: number
    height: number
  }): Promise<ProfileActionResult<ImageUploadResponse>> {
    try {
      // Validate image
      const validation = ImageProcessor.validateImage(file)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Process image
      let processedFile = file
      
      if (cropData) {
        // Custom crop
        processedFile = await ImageProcessor.cropImage(file, cropData, 400, 400)
      } else {
        // Auto crop to square
        processedFile = await ImageProcessor.cropToSquare(file, 400)
      }

      // Compress
      processedFile = await ImageProcessor.compressImage(processedFile, 400, 400, 0.9)

      // Upload to server
      const response = await apiClient.upload<ImageUploadResponse>(
        '/upload/avatar',
        processedFile,
        {
          onUploadProgress: (progress) => {
            console.log(`Avatar upload progress: ${progress}%`)
          }
        }
      )

      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Avatar upload failed' }
    }
  }

  // Upload cover image
  async uploadCoverImage(file: File, cropData?: {
    x: number
    y: number
    width: number
    height: number
  }): Promise<ProfileActionResult<ImageUploadResponse>> {
    try {
      // Validate image
      const validation = ImageProcessor.validateImage(file)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Process image
      let processedFile = file
      
      if (cropData) {
        // Custom crop
        processedFile = await ImageProcessor.cropImage(file, cropData, 1200, 400)
      } else {
        // Auto resize for cover image (16:5 ratio)
        processedFile = await ImageProcessor.compressImage(file, 1200, 400, 0.9)
      }

      // Upload to server
      const response = await apiClient.upload<ImageUploadResponse>(
        '/upload/cover',
        processedFile,
        {
          onUploadProgress: (progress) => {
            console.log(`Cover image upload progress: ${progress}%`)
          }
        }
      )

      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message || 'Cover image upload failed' }
    }
  }

  // Upload post images (multiple)
  async uploadPostImages(files: File[]): Promise<ProfileActionResult<ImageUploadResponse[]>> {
    try {
      const results: ImageUploadResponse[] = []
      
      for (const file of files) {
        // Validate each image
        const validation = ImageProcessor.validateImage(file)
        if (!validation.isValid) {
          return { success: false, error: validation.error }
        }

        // Process image (compress but maintain aspect ratio)
        const processedFile = await ImageProcessor.compressImage(file, 1200, 1200, 0.85)

        // Generate thumbnail
        const thumbnail = await ImageProcessor.generateThumbnail(processedFile, 300)

        // Upload main image
        const mainResponse = await apiClient.upload<ImageUploadResponse>(
          '/upload/post',
          processedFile
        )

        // Upload thumbnail
        const thumbResponse = await apiClient.upload<ImageUploadResponse>(
          '/upload/post/thumbnail',
          thumbnail
        )

        results.push({
          ...mainResponse.data,
          thumbnailUrl: thumbResponse.data.url
        })
      }

      return { success: true, data: results }
    } catch (error: any) {
      return { success: false, error: error.message || 'Post images upload failed' }
    }
  }

  // Delete image from server
  async deleteImage(imageUrl: string): Promise<ProfileActionResult> {
    try {
      await apiClient.delete('/upload/delete', {
        data: { imageUrl }
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Image deletion failed' }
    }
  }

  // Get optimized image URL with transformations
  getOptimizedImageUrl(
    originalUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    } = {}
  ): string {
    if (!originalUrl) return ''

    // Build query parameters for image transformation
    const params = new URLSearchParams()
    
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)

    const queryString = params.toString()
    return queryString ? `${originalUrl}?${queryString}` : originalUrl
  }

  // Generate multiple sizes for responsive images
  generateResponsiveSizes(originalUrl: string): {
    small: string
    medium: string
    large: string
    original: string
  } {
    return {
      small: this.getOptimizedImageUrl(originalUrl, { width: 400, quality: 80 }),
      medium: this.getOptimizedImageUrl(originalUrl, { width: 800, quality: 85 }),
      large: this.getOptimizedImageUrl(originalUrl, { width: 1200, quality: 90 }),
      original: originalUrl
    }
  }

  // Check if image URL is valid/accessible
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok && response.headers.get('content-type')?.startsWith('image/')
    } catch {
      return false
    }
  }
}

// Avatar utilities for UI components
export const AvatarUtils = {
  // Get avatar URL with fallback
  getAvatarUrl(user: { avatar?: string; displayName?: string; username?: string }, size = 100): string {
    if (user.avatar) {
      return imageService.getOptimizedImageUrl(user.avatar, { width: size, height: size, format: 'webp' })
    }
    
    // Generate initials avatar as fallback
    const name = user.displayName || user.username || 'U'
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    
    // Use a service like UI Avatars or generate locally
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=random`
  },

  // Get initials from name
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  // Generate placeholder colors based on user ID
  getPlaceholderColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }
}

// Create singleton instance
export const imageService = new ImageService()
export { ImageProcessor }
export default imageService
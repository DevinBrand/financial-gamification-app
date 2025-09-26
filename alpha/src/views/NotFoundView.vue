<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
    <div class="text-center space-y-8">
      <div class="text-9xl font-bold text-primary/20">404</div>
      <div class="space-y-4">
        <h1 class="text-4xl font-bold">Page Not Found</h1>
        <p class="text-xl text-base-content/70">
          The page you're looking for doesn't exist.
        </p>
      </div>
      <div class="space-y-4">
        <router-link to="/" class="btn btn-primary btn-lg">
          Go Home
        </router-link>
        <button @click="$router.back()" class="btn btn-ghost btn-lg ml-4">
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple 404 page
</script>
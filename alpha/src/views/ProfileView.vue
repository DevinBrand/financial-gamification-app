<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Profile</h1>
        <p class="text-base-content/70">Manage your profile information</p>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Profile Information</h2>
          <div v-if="user" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">
                  <span class="label-text">Name</span>
                </label>
                <input type="text" :value="user.name" class="input input-bordered w-full" readonly />
              </div>
              <div>
                <label class="label">
                  <span class="label-text">Email</span>
                </label>
                <input type="email" :value="user.email" class="input input-bordered w-full" readonly />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="label-text">Email Verified:</span>
              <div class="badge" :class="user.emailVerified ? 'badge-success' : 'badge-warning'">
                {{ user.emailVerified ? 'Verified' : 'Not Verified' }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="label-text">Two-Factor:</span>
              <div class="badge" :class="user.twoFactorEnabled ? 'badge-success' : 'badge-neutral'">
                {{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
</script>
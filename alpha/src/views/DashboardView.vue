<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-base-content/70">Welcome back, {{ user?.name }}!</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Profile</h2>
            <p>Manage your account settings and preferences.</p>
            <div class="card-actions justify-end">
              <router-link to="/profile" class="btn btn-primary">View Profile</router-link>
            </div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Subscription</h2>
            <p>Manage your subscription and billing.</p>
            <div class="card-actions justify-end">
              <router-link to="/subscription" class="btn btn-primary">Manage</router-link>
            </div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Settings</h2>
            <p>Configure your account settings.</p>
            <div class="card-actions justify-end">
              <router-link to="/settings" class="btn btn-primary">Settings</router-link>
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
<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Settings</h1>
        <p class="text-base-content/70">Manage your account settings and preferences</p>
      </div>

      <div class="space-y-6">
        <!-- Security Settings -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Security</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">Two-Factor Authentication</h3>
                  <p class="text-sm text-base-content/70">Add an extra layer of security</p>
                </div>
                <div class="badge" :class="user?.twoFactorEnabled ? 'badge-success' : 'badge-neutral'">
                  {{ user?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </div>
              </div>
              
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">Change Password</h3>
                  <p class="text-sm text-base-content/70">Update your login password</p>
                </div>
                <button class="btn btn-outline btn-sm">Change</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Settings -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Account</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">Email Notifications</h3>
                  <p class="text-sm text-base-content/70">Receive email updates</p>
                </div>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </div>
              
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">Marketing Emails</h3>
                  <p class="text-sm text-base-content/70">Product updates and news</p>
                </div>
                <input type="checkbox" class="toggle toggle-primary" />
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card bg-base-100 shadow border-error">
          <div class="card-body">
            <h2 class="card-title text-error">Danger Zone</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">Sign Out</h3>
                  <p class="text-sm text-base-content/70">Sign out of your account</p>
                </div>
                <button @click="handleSignOut" class="btn btn-error btn-sm">Sign Out</button>
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

const { user, signOut } = useAuth()

async function handleSignOut() {
  await signOut()
}
</script>
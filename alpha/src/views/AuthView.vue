<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
    <!-- Navigation Header -->
    <header class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <router-link to="/" class="btn btn-ghost text-xl">
          <font-awesome-icon icon="chart-line" class="w-6 h-6 mr-2 text-primary" />
          FinanceGame
        </router-link>
      </div>
      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <button tabindex="0" role="button" class="btn btn-ghost">
            <font-awesome-icon icon="globe" class="w-5 h-5" />
            <span class="ml-2">EN</span>
            <font-awesome-icon icon="chevron-down" class="w-4 h-4 ml-1" />
          </button>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
            <li><a>English</a></li>
            <li><a>Español</a></li>
            <li><a>Français</a></li>
          </ul>
        </div>
        
        <label class="swap swap-rotate btn btn-ghost">
          <input 
            type="checkbox" 
            class="theme-controller" 
            :checked="isDarkMode"
            @change="toggleTheme"
          />
          <font-awesome-icon icon="sun" class="swap-off w-5 h-5" />
          <font-awesome-icon icon="moon" class="swap-on w-5 h-5" />
        </label>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex items-center justify-center p-4 pt-8">
      <div class="w-full max-w-6xl">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <!-- Left Side - Marketing Content -->
          <div class="hidden lg:block space-y-8">
            <div class="text-center lg:text-left">
              <h1 class="text-5xl font-bold text-primary mb-4">
                Gamify Your
                <span class="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Financial Future
                </span>
              </h1>
              <p class="text-xl text-base-content/80 mb-8">
                Transform your financial habits into an engaging game. 
                Track expenses, set goals, and earn rewards for smart money decisions.
              </p>
            </div>

            <!-- Feature Highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="trophy" class="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Achievement System</h3>
                  <p class="text-base-content/70">Unlock badges and trophies for reaching your financial milestones</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="chart-bar" class="w-6 h-6 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Smart Analytics</h3>
                  <p class="text-base-content/70">Get insights into your spending patterns and financial behavior</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="users" class="w-6 h-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Community Challenges</h3>
                  <p class="text-base-content/70">Join challenges with friends and compete on leaderboards</p>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="shield-alt" class="w-6 h-6 text-info" />
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Bank-Level Security</h3>
                  <p class="text-base-content/70">Your financial data is protected with enterprise-grade security</p>
                </div>
              </div>
            </div>

            <!-- Testimonial -->
            <div class="bg-base-100 rounded-2xl p-6 shadow-lg">
              <div class="flex items-center gap-4 mb-4">
                <div class="avatar">
                  <div class="w-12 rounded-full">
                    <img src="https://i.pravatar.cc/100?u=testimonial1" alt="User avatar" />
                  </div>
                </div>
                <div>
                  <h4 class="font-bold">Sarah Chen</h4>
                  <p class="text-sm text-base-content/60">Premium Member</p>
                </div>
              </div>
              <p class="text-base-content/80 italic">
                "This app completely changed how I think about money. The gamification aspect made saving fun, 
                and I've saved more in 6 months than I did in the previous 2 years!"
              </p>
              <div class="rating rating-sm mt-3">
                <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
                <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
                <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
                <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
                <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" checked />
              </div>
            </div>
          </div>

          <!-- Right Side - Authentication Forms -->
          <div class="flex justify-center">
            <Transition 
              name="slide-fade" 
              mode="out-in"
              appear
            >
              <LoginForm
                v-if="currentView === 'login'"
                @switch-to-register="currentView = 'register'"
                class="transform-gpu"
              />
              <RegisterForm
                v-else
                @switch-to-login="currentView = 'login'"
                class="transform-gpu"
              />
            </Transition>
          </div>
        </div>

        <!-- Trust Indicators -->
        <div class="mt-16 text-center">
          <p class="text-base-content/50 mb-4">Trusted by 10,000+ users worldwide</p>
          <div class="flex justify-center items-center gap-8 opacity-60">
            <div class="text-2xl font-bold">256-bit SSL</div>
            <div class="text-2xl font-bold">SOC 2 Compliant</div>
            <div class="text-2xl font-bold">GDPR Ready</div>
            <div class="text-2xl font-bold">Bank-Grade Security</div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer footer-center p-8 bg-base-200 text-base-content mt-16">
      <div class="grid grid-flow-col gap-4">
        <a href="/about" class="link link-hover">About</a>
        <a href="/contact" class="link link-hover">Contact</a>
        <a href="/privacy" class="link link-hover">Privacy</a>
        <a href="/terms" class="link link-hover">Terms</a>
        <a href="/help" class="link link-hover">Help</a>
      </div>
      <div class="grid grid-flow-col gap-4">
        <a href="#" class="text-2xl hover:text-primary transition-colors">
          <font-awesome-icon :icon="['fab', 'twitter']" />
        </a>
        <a href="#" class="text-2xl hover:text-primary transition-colors">
          <font-awesome-icon :icon="['fab', 'linkedin']" />
        </a>
        <a href="#" class="text-2xl hover:text-primary transition-colors">
          <font-awesome-icon :icon="['fab', 'github']" />
        </a>
        <a href="#" class="text-2xl hover:text-primary transition-colors">
          <font-awesome-icon :icon="['fab', 'discord']" />
        </a>
      </div>
      <div>
        <p>Copyright © 2024 FinanceGame. All rights reserved.</p>
      </div>
    </footer>

    <!-- Background decorations -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

// State
const currentView = ref<'login' | 'register'>('login')
const isDarkMode = ref(false)

// Route handling
const route = useRoute()

// Theme management
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// Initialize
onMounted(() => {
  // Check route for initial view
  if (route.query.view === 'register') {
    currentView.value = 'register'
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.text-gradient {
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
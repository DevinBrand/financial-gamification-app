<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
#app {
  min-height: 100vh;
}

html {
  scroll-behavior: smooth;
}

/* Custom toast styles */
.Vue-Toastification__toast {
  border-radius: 0.5rem;
}

.Vue-Toastification__toast--success {
  background-color: hsl(var(--su));
  color: hsl(var(--suc));
}

.Vue-Toastification__toast--error {
  background-color: hsl(var(--er));
  color: hsl(var(--erc));
}

.Vue-Toastification__toast--warning {
  background-color: hsl(var(--wa));
  color: hsl(var(--wac));
}

.Vue-Toastification__toast--info {
  background-color: hsl(var(--in));
  color: hsl(var(--inc));
}
</style>

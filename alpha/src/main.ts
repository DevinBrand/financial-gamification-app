import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faCheck,
  faCheckCircle,
  faArrowLeft,
  faChevronDown,
  faGlobe,
  faSun,
  faMoon,
  faChartLine,
  faTrophy,
  faChartBar,
  faUsers,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons'
import {
  faGoogle,
  faGithub,
  faDiscord,
  faTwitter,
  faLinkedin
} from '@fortawesome/free-brands-svg-icons'

import App from './App.vue'
import router from './router'
import './assets/app.css'

// FontAwesome setup
library.add(
  faEye,
  faEyeSlash,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faCheck,
  faCheckCircle,
  faArrowLeft,
  faChevronDown,
  faGlobe,
  faSun,
  faMoon,
  faChartLine,
  faTrophy,
  faChartBar,
  faUsers,
  faShieldAlt,
  faGoogle,
  faGithub,
  faDiscord,
  faTwitter,
  faLinkedin
)

const app = createApp(App)

// Toast configuration
const toastOptions = {
  position: 'top-right' as const,
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)

app.mount('#app')

<script setup lang="ts">
import {AUTH_ROUTE} from '../../pages/auth/auth.route.ts';
import {AUTO_LOGIN, useLocalStorage} from "@/shared/libs/access-localstorage";
import {ILoginData} from "@/shared/libs/access-localstorage/types.ts";
import {McmpRouter} from "@/app/providers/router";

const handleLogout = () => {
  const loginDataLocalStorage = useLocalStorage<ILoginData>(AUTO_LOGIN);
  loginDataLocalStorage.setItem({role: null, autoLogin: false});

  McmpRouter.getRouter()
      .push({name: AUTH_ROUTE.LOGIN._NAME})
      .catch(() => {
      });
};
</script>

<template>
  <div class="h-full">
    <header class="main-header">
      <ul class="flex gap-5">
        <li>
          <router-link to="/main/dashboard">
            <button>
              Go to dashboard

            </button>
          </router-link>
        </li>
        <li>
          <router-link to="/main/auth">
            <button>
              Go to login
            </button>
          </router-link>

        </li>
        <li>
          <router-link to="/main/auth/cookie">
            <button> Go to cookie</button>
          </router-link>
        </li>
        <li>
          <button @click="handleLogout">Log out</button>
        </li>
      </ul>
    </header>
    <main class="main-body">
      <slot/>
    </main>
  </div>
</template>

<style scoped lang="postcss">
.main-header {
  height: 100px;
  border: 1px solid black;

  ul {
    list-style-type: none;

    li {
      border: 1px solid blue;
    }
  }
}

.main-body {
  height: calc(100% - 100px);
  border: 1px solid black;
}
</style>

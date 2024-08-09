<script setup lang="ts">
import { PButton } from '@cloudforet-test/mirinae';
import {AuthorizationType, AUTO_LOGIN, useLocalStorage} from "@/shared/libs/access-localstorage";
import {ILoginData} from "@/shared/libs/access-localstorage/types.ts";
import {useAuthenticationStore, useAuthorizationStore} from "@/shared/libs/store";
import {DASHBOARD_ROUTE} from "@/pages/dashboard/dashboard.route.ts";
import {McmpRouter} from "@/app/providers/router";

const loginDataLocalStorage = useLocalStorage<ILoginData>(AUTO_LOGIN);
let autoLogin: boolean = loginDataLocalStorage.data?.value?.autoLogin || false;

const handleLogin = (type: AuthorizationType) => {
  const authenticationStore = useAuthenticationStore();
  const authorizationStore = useAuthorizationStore();

  authorizationStore.setRole(type);
  authenticationStore.onLogin();

  if (autoLogin) {
    loginDataLocalStorage.setItem({ role: type, autoLogin });
  }

  McmpRouter.getRouter().push({ name: DASHBOARD_ROUTE._NAME });
};
const handCheckBox = (event: any) => {
  autoLogin = event.target.checked;
};
</script>

<template>
  <div>
    <h1>login page</h1>
    <div class="login-box">
      <div class="login-buttons">
        <p-button @click="handleLogin('client')"> client Login </p-button>
        <p-button @click="handleLogin('admin')"> admin Login </p-button>
      </div>
      <div>
        <input
          id="auto-login"
          :checked="autoLogin"
          type="checkbox"
          @input="handCheckBox"
        />
        <label for="auto-login">자동로그인</label>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.login-box {
  display: flex;
  gap: 20px;
}

.login-buttons {
  display: flex;
  gap: 5px;
}
</style>

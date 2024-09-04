<script setup lang="ts">
import { PButton, PTextInput } from '@cloudforet-test/mirinae';
import { useGetLogin, useGetUserRole } from '@/entities';
import { IUser, IUserResponse } from '@/entities/user/model/types.ts';
import { watch } from 'vue';
import { useAuth } from '@/features/auth/model/useAuth.ts';
import { McmpRouter } from '@/app/providers/router';
import { DASHBOARD_ROUTE } from '@/pages/dashboard/dashboard.route.ts';

const loginData: IUser = {
  id: 'mcpadmin',
  password: 'mcpuserpassword',
};

const resLogin = useGetLogin<IUserResponse, IUser | null>(null);
const resUserInfo = useGetUserRole<IUserResponse>();
const auth = useAuth();

const handleLogin = () => {
  resLogin.execute({ request: loginData });
};

watch(resLogin.data, () => {
  auth.setUser({
    ...resLogin.data.value?.responseData,
    id: loginData.id,
    role: '',
  });
  McmpRouter.getRouter().push({ name: DASHBOARD_ROUTE.AWS._NAME });

  resUserInfo.execute();
});
</script>

<template>
  <div class="login-box">
    <fieldset
      style="
        border: 3px solid black;
        border-radius: 20px;
        padding: 20px;
        margin: 20px 0 20px 0;
      "
    >
      <legend>Login</legend>
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        "
      >
        <div style="display: flex; flex-direction: column; align-items: start">
          <label>id</label>
          <p-text-input v-model="loginData.id" />
        </div>
        <div style="display: flex; flex-direction: column; align-items: start">
          <label>password</label>
          <p-text-input v-model="loginData.password" />
        </div>
      </div>

      <p-button
        style="margin-top: 20px"
        styleType="primary"
        size="md"
        :loading="false"
        href="#"
        :iconLeft="null"
        :iconRight="null"
        :block="false"
        :disabled="false"
        :readonly="false"
        @click="handleLogin"
      >
        Login
      </p-button>
    </fieldset>
    <div class="res-test-box">
      <p v-if="resLogin.status.value === 'idle'">idle</p>
      <p v-if="resLogin.status.value === 'loading'">Loading</p>
      <p v-if="resLogin.status.value === 'success'">
        {{ resLogin.data }}
      </p>
      <p v-if="resLogin.status.value === 'error'">{{ resLogin.errorMsg }}</p>
    </div>
    <div>
      <p>{{ auth.getUser() }}</p>
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

.res-test-box {
  width: 400px;
  border: 1px solid red;
}
</style>

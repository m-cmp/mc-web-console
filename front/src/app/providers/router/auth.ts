import { McmpRouter } from './index.ts';
import {ILoginData} from "@/shared/libs/access-localstorage/types.ts";
import {useLocalStorage} from "@/shared/libs/access-localstorage/useLocalStorage.ts";
import {AUTO_LOGIN} from "@/shared/libs/access-localstorage/constant.ts";

import {DASHBOARD_ROUTE} from "@/pages/dashboard/dashboard.route.ts";
import {useAuthenticationStore, useAuthorizationStore} from "@/shared/libs/store";

export const preAutoLogin = () => {
  const { data } = useLocalStorage<ILoginData>(AUTO_LOGIN);
  const authentication = useAuthenticationStore();
  const authorizationStore = useAuthorizationStore();

  if (data.value?.autoLogin) {
    authentication.onLogin();
    authorizationStore.role = data.value.role;
  }

  McmpRouter.getRouter()
    .push({ name: DASHBOARD_ROUTE._NAME })
    .catch(() => {});
};

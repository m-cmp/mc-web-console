import VueRouter, { Route, RouteConfig } from 'vue-router';
import {ROOT_ROUTE} from "@/app/providers/router/constants.ts";
import dashboardRoutes from "@/pages/dashboard/dashboard.route.ts";
import authRoutes, {AUTH_ROUTE} from "@/pages/auth/auth.route.ts";
import NotFound from "@/pages/error/404/NotFound.vue";
import {useAuthenticationStore, useAuthorizationStore} from "@/shared/libs/store";
import {AuthorizationType} from "@/shared/libs/store/authorizationStore.ts";
import MainPage from "@/pages/main/MainPage.vue";


//TODO admin부분 고려

export class McmpRouter {
  private static router: VueRouter | null = null;

  private static rootRoute: RouteConfig[] = [
    {
      path: '/',
      redirect: '/main',
      name: ROOT_ROUTE._NAME,
    },
    {
      path: '/main',
      component: MainPage,
      children: [...dashboardRoutes, ...authRoutes],
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ];

  public static getRouter(): VueRouter {
    if (McmpRouter.router === null) {
      McmpRouter.initRouter();
    }
    return McmpRouter.router!;
  }

  public static initRouter() {
    if (this.router === null) {
      McmpRouter.router = new VueRouter({
        mode: 'history',
        routes: McmpRouter.rootRoute,
      });

      McmpRouter.router.beforeEach((to: Route, from: Route, next) => {
        const isLogin = useAuthenticationStore().login;
        const userRole = useAuthorizationStore().role;

        // console.log(isLogin);
        // console.log(userRole);
        // console.log(to);

        if (!isLogin) {
          if (to.name === AUTH_ROUTE.LOGIN._NAME) {
            next();
            return;
          } else {
            next({ name: AUTH_ROUTE.LOGIN._NAME });
          }
        }

        /* 역할기반 access control */
        const accessibleRoles: AuthorizationType[] = to.meta?.roles || [];

        /*
         * 1. admin 만 접근가능한 페이지 인지를 판단함.
         * 2. admin만 접근 가능하다면 role이 admin인지 판단함.
         * 3-1. role이 admin이 아니라면 from으로 돌아가고 alert를 함.
         * 3-2. role이 admin이라면 to로 next함.
         *
         *
         * 유저별로 접근가능한 메뉴가 다르다면?
         * 1. 서버에서 접근가능한 메뉴목록들을 가져와서 변수에 저장한다음, 페이지를 이동할 때 마다 해당 변수에 값이 들어있는지를 검사하는 로직을 추가.
         * */

        if (accessibleRoles.length > 0 && accessibleRoles.includes('admin')) {
          if (userRole === 'admin') {
            next();
          } else {
            next(false);
            alert('권한이 없습니다.');
          }
        } else {
          next();
        }
      });
    }
  }
}

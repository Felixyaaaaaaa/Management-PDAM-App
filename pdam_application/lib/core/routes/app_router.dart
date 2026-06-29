import 'package:go_router/go_router.dart';

import '../../features/dashboard/pages/dashboard_page.dart';
import '../../features/dashboard/pages/detail_pencatatan_page.dart';
import '../../features/dashboard/models/pencatatan_meter_model.dart';
import '../../features/auth/pages/login_page.dart';
import '../../features/auth/pages/splash_page.dart';
import '../../features/auth/pages/profile_page.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardPage(),
    ),
    GoRoute(
      path: '/detail-pencatatan',
      builder: (context, state) {
        final item = state.extra as PencatatanMeterModel;
        return DetailPencatatanPage(item: item);
      },
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfilePage(),
    ),
  ],
);

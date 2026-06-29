import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/storage/secure_storage_service.dart';

import '../../../core/utils/jwt_helper.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {

  @override
  void initState() {
    super.initState();
    _checkLogin();
  }

  Future<void> _checkLogin() async {

    await Future.delayed(
      const Duration(seconds: 2),
    );

    final token =
    await SecureStorageService.getToken();

    if (token == null) {
      context.go('/login');
      return;
    }

    final expired =
    JwtHelper.isExpired(token);

    if (expired) {

      await SecureStorageService.logout();

      if (!mounted) return;

      context.go('/login');

      return;
    }

    context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Image(image: AssetImage("assets/images/splash.png"))
        
      ),
    );
  }
}
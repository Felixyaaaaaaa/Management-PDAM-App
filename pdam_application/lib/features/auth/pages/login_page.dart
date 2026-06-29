import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/auth_repository.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../dashboard/providers/dashboard_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final authRepository = AuthRepository();
  bool obscure = true;
  bool isLoading = false;

  void showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> login() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      showError('Email dan password harus diisi');
      return;
    }

    setState(() => isLoading = true);
    try {
      final response = await authRepository.login(
        email: emailController.text.trim(),
        password: passwordController.text,
      );

      // Defensive parsing: response may be {"token":..., "user": {...}} or nested
      final token = response['token'] ?? response['access_token'] ?? response['data']?['token'];
      final user = response['user'] ?? response['data']?['user'] ?? response['users'];

      if (token == null || user == null) {
        throw Exception('Respons login tidak valid');
      }

      final role = user['role']?.toString() ?? '';

      if (role != 'admin' && role != 'petugas') {
        showError('Role tidak memiliki akses aplikasi');
        return;
      }

      // Clear previous session explicitly to avoid stale user data
      await SecureStorageService.logout();

      // Normalize id to int
      int id = 0;
      final rawId = user['id'] ?? user['user_id'] ?? user['id_user'];
      if (rawId is int) id = rawId;
      if (rawId is String) id = int.tryParse(rawId) ?? 0;

      await SecureStorageService.saveAuth(
        token: token.toString(),
        id: id,
        name: user['name']?.toString() ?? '',
        email: user['email']?.toString() ?? '',
        role: role,
      );

      // Refresh dashboard data providers after login to avoid showing previous user's data
      ref.invalidate(listPetugasProvider);
      ref.invalidate(filteredListPetugasProvider);

      if (!mounted) return;
      context.go('/dashboard');
    } catch (e) {
      showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.water_drop, size: 80, color: Colors.blue),
                const SizedBox(height: 16),
                const Text(
                  "Tirto Wening",
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.blue),
                ),
                const Text(
                  "PDAM - Aplikasi Petugas",
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 48),
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        const Text(
                          "Login",
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 24),
                        TextField(
                          controller: emailController,
                          decoration: InputDecoration(
                            labelText: "Email",
                            prefixIcon: const Icon(Icons.email),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: passwordController,
                          obscureText: obscure,
                          decoration: InputDecoration(
                            labelText: "Password",
                            prefixIcon: const Icon(Icons.lock),
                            suffixIcon: IconButton(
                              onPressed: () => setState(() => obscure = !obscure),
                              icon: Icon(obscure ? Icons.visibility : Icons.visibility_off),
                            ),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          height: 55,
                          child: ElevatedButton(
                            onPressed: isLoading ? null : login,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: isLoading
                                ? const CircularProgressIndicator(color: Colors.white)
                                : const Text("MASUK", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                const Text(
                  "Design by ©RHINNO",
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}

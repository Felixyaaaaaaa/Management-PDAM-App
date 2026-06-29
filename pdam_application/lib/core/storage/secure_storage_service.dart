import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage();

  static Future<void> saveAuth({
    required String token,
    required dynamic id,
    required String name,
    required String email,
    required String role,
  }) async {
    // Ensure id is stored as string
    final idStr = (id is String) ? id : id?.toString() ?? '0';

    await _storage.write(key: 'token', value: token);
    await _storage.write(key: 'id', value: idStr);
    await _storage.write(key: 'name', value: name);
    await _storage.write(key: 'email', value: email);
    await _storage.write(key: 'role', value: role);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }

  static Future<String?> getId() async {
    return await _storage.read(key: 'id');
  }

  static Future<String?> getName() async {
    return await _storage.read(key: 'name');
  }

  static Future<String?> getEmail() async {
    return await _storage.read(key: 'email');
  }

  static Future<String?> getRole() async {
    return await _storage.read(key: 'role');
  }

  static Future<void> saveDashboardStatus(String status) async {
    await _storage.write(key: 'dashboard_status', value: status);
  }

  static Future<String?> getDashboardStatus() async {
    return await _storage.read(key: 'dashboard_status');
  }

  static Future<void> logout() async {
    // remove only auth related keys to be safe
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'id');
    await _storage.delete(key: 'name');
    await _storage.delete(key: 'email');
    await _storage.delete(key: 'role');
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();

    if (token == null) {
      return false;
    }

    try {
      bool isTokenExpired = JwtDecoder.isExpired(token);
      if (isTokenExpired) {
        await logout();
        return false;
      }
      return true;
    } catch (e) {
      await logout();
      return false;
    }
  }
}

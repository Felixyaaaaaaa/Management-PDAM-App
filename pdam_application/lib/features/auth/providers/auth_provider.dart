import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../models/profile_model.dart';
import '../repositories/auth_repository.dart';
import '../../../core/storage/secure_storage_service.dart';

final authRepositoryProvider = Provider((ref) => AuthRepository());

final profileProvider = FutureProvider<ProfileModel>((ref) async {
  final repository = ref.read(authRepositoryProvider);
  // Try stored user id first
  String? userIdStored = await SecureStorageService.getId();

  if (userIdStored == null || userIdStored.isEmpty) {
    // Fallback: try to decode id from token
    final token = await SecureStorageService.getToken();
    if (token != null && token.isNotEmpty) {
      try {
        final decoded = JwtDecoder.decode(token);
        // Common claim names: id, user_id, sub
        final dynamic idClaim = decoded['id'] ?? decoded['user_id'] ?? decoded['sub'];
        if (idClaim != null) {
          userIdStored = idClaim.toString();
        }
      } catch (e) {
        // ignore decode error, will throw below
      }
    }
  }

  if (userIdStored == null || userIdStored.isEmpty) {
    throw Exception('User ID not found');
  }

  final userId = int.tryParse(userIdStored) ?? 0;
  if (userId == 0) {
    throw Exception('Invalid User ID');
  }

  return repository.getProfile(userId);
});

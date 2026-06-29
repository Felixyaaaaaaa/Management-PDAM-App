import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/utils/api_exception.dart';
import '../models/profile_model.dart';

class AuthRepository {
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await DioClient.dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      // Standardize returned payload: prefer `data` field when present
      if (response.data is Map<String, dynamic>) {
        final Map<String, dynamic> body = response.data;
        if (body.containsKey('data') && body['data'] is Map<String, dynamic>) {
          return Map<String, dynamic>.from(body['data']);
        }
        return Map<String, dynamic>.from(body);
      }

      // Fallback: try to coerce to map
      return Map<String, dynamic>.from(response.data);
    } on DioException catch (e) {
      String message = 'Terjadi kesalahan pada server';
      if (e.response?.data is Map) {
        final responseMessage = e.response?.data['message'];
        if (responseMessage != null) {
          message = responseMessage.toString();
        }
      }
      throw ApiException(message);
    }
  }

  Future<ProfileModel> getProfile(int userId) async {
    try {
      final response = await DioClient.dio.get('/auth/profile/$userId');

      dynamic parsedData = response.data;

      // Ensure we have a parsed Map for response.data
      if (parsedData is String) {
        try {
          parsedData = jsonDecode(parsedData);
        } catch (e) {
          throw ApiException('Gagal parse response: $e');
        }
      }

      // If backend returns {data: {...}}, unwrap it
      if (parsedData is Map<String, dynamic> && parsedData.containsKey('data')) {
        final innerData = parsedData['data'];
        if (innerData is Map<String, dynamic>) {
          parsedData = innerData;
        }
      }

      // If backend mistakenly returns a List with one object, unwrap it
      if (parsedData is List && parsedData.isNotEmpty && parsedData[0] is Map) {
        parsedData = parsedData[0];
      }

      if (response.statusCode == 200 && parsedData is Map<String, dynamic>) {
        try {
          return ProfileModel.fromJson(parsedData);
        } catch (parseError, stack) {
          print('Error parsing profile response: $parseError');
          print(stack);
          throw ApiException('Gagal mem-parse data profil: $parseError');
        }
      } else {
        throw ApiException('Gagal memuat profil (status: ${response.statusCode})');
      }
    } on DioException catch (e) {
      String message = 'Terjadi kesalahan jaringan';
      if (e.response?.data is Map) {
        final responseMessage = e.response?.data['message'];
        if (responseMessage != null) {
          message = responseMessage.toString();
        }
      }
      throw ApiException(message);
    } catch (e) {
      throw ApiException('Terjadi kesalahan: $e');
    }
  }
}

import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';

class PencatatanRepository {
  Future<void> updateMeter(int pencatatanId, int meterAkhir) async {
    try {
      final response = await DioClient.dio.put(
        '/pencatatan/$pencatatanId/update-meter',
        data: {
          'meter_akhir': meterAkhir,
        },
      );

      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Gagal memperbarui meteran');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Terjadi kesalahan jaringan');
    }
  }

  Future<void> bayarTagihan({
    required int tagihanId,
    required double jumlahBayar,
    required String metode,
  }) async {
    try {
      final response = await DioClient.dio.post(
        '/pembayaran',
        data: {
          'tagihan_id': tagihanId,
          'jumlah_bayar': jumlahBayar,
          'metode': metode,
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception(response.data['message'] ?? 'Gagal melakukan pembayaran');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Terjadi kesalahan jaringan');
    }
  }

  Future<Map<String, dynamic>> getTagihanById(int tagihanId) async {
    try {
      final response = await DioClient.dio.get('/tagihan/$tagihanId');
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('Gagal mengambil data tagihan terbaru');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Terjadi kesalahan jaringan');
    }
  }
}

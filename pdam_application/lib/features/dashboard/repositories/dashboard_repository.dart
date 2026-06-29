import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../models/pencatatan_meter_model.dart';

class DashboardRepository {
  Future<List<PencatatanMeterModel>> getListPetugas({
    String? bulan,
    String? tahun,
  }) async {
    try {
      final response = await DioClient.dio.get(
        '/tagihan/list-petugas-app',
        queryParameters: {
          if (bulan != null) 'bulan': bulan,
          if (tahun != null) 'tahun': tahun,
        },
      );

      if (response.statusCode == 200) {
        final List data = response.data['data'];
        return data.map((e) => PencatatanMeterModel.fromJson(e)).toList();
      } else {
        throw Exception(response.data['message'] ?? 'Gagal memuat data');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Terjadi kesalahan jaringan');
    }
  }
}

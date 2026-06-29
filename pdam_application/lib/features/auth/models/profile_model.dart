class ProfileModel {
  final UserProfile user;
  final Ringkasan ringkasan;
  final List<RekapPerBulan> rekapPerBulan;

  ProfileModel({
    required this.user,
    required this.ringkasan,
    required this.rekapPerBulan,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    try {
      final user = json['user'] is Map<String, dynamic>
          ? UserProfile.fromJson(json['user'])
          : UserProfile(id: 0, name: '', email: '', role: '', createdAt: '');

      final ringkasan = json['ringkasan'] is Map<String, dynamic>
          ? Ringkasan.fromJson(json['ringkasan'])
          : Ringkasan(totalPencatatan: 0, totalPelangganUnik: 0, totalPemakaian: 0, totalTagihan: 0);

      final List<RekapPerBulan> rekapList = [];
      final rawRekap = json['rekap_per_bulan'];
      if (rawRekap is List) {
        for (final item in rawRekap) {
          if (item is Map<String, dynamic>) {
            try {
              rekapList.add(RekapPerBulan.fromJson(item));
            } catch (e) {
              print('Warning: Failed to parse RekapPerBulan item: $e, skipping item');
            }
          }
        }
      }

      return ProfileModel(user: user, ringkasan: ringkasan, rekapPerBulan: rekapList);
    } catch (e) {
      print('Error parsing ProfileModel: $e');
      rethrow;
    }
  }
}

class UserProfile {
  final int id;
  final String name;
  final String email;
  final String role;
  final String createdAt;

  UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: _toInt(json['id']),
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }
}

class Ringkasan {
  final int totalPencatatan;
  final int totalPelangganUnik;
  final int totalPemakaian;
  final int totalTagihan;

  Ringkasan({
    required this.totalPencatatan,
    required this.totalPelangganUnik,
    required this.totalPemakaian,
    required this.totalTagihan,
  });

  factory Ringkasan.fromJson(Map<String, dynamic> json) {
    try {
      return Ringkasan(
        totalPencatatan: _toInt(json['total_pencatatan']),
        totalPelangganUnik: _toInt(json['total_pelanggan_unik']),
        totalPemakaian: _toInt(json['total_pemakaian']),
        totalTagihan: _toInt(json['total_tagihan']),
      );
    } catch (e) {
      print('Error parsing Ringkasan: $e');
      return Ringkasan(
        totalPencatatan: 0,
        totalPelangganUnik: 0,
        totalPemakaian: 0,
        totalTagihan: 0,
      );
    }
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }
}

class RekapPerBulan {
  final int tahun;
  final int bulan;
  final String namaBulan;
  final String periode;
  final int jumlahPencatatan;
  final int jumlahPelanggan;
  final int totalPemakaian;
  final int totalTagihan;

  RekapPerBulan({
    required this.tahun,
    required this.bulan,
    required this.namaBulan,
    required this.periode,
    required this.jumlahPencatatan,
    required this.jumlahPelanggan,
    required this.totalPemakaian,
    required this.totalTagihan,
  });

  factory RekapPerBulan.fromJson(Map<String, dynamic> json) {
    try {
      final tahun = _toInt(json['tahun']);
      final bulan = _toInt(json['bulan']);
      final namaBulanFromResponse = json['nama_bulan']?.toString() ?? '';
      final periodeFromResponse = json['periode']?.toString() ?? '';

      // If nama_bulan or periode is empty, generate from bulan/tahun
      final finalNamaBulan = namaBulanFromResponse.isNotEmpty
          ? namaBulanFromResponse
          : _getBulanName(bulan);

      final finalPeriode = periodeFromResponse.isNotEmpty
          ? periodeFromResponse
          : '$finalNamaBulan $tahun';

      return RekapPerBulan(
        tahun: tahun,
        bulan: bulan,
        namaBulan: finalNamaBulan,
        periode: finalPeriode,
        jumlahPencatatan: _toInt(json['jumlah_pencatatan']),
        jumlahPelanggan: _toInt(json['jumlah_pelanggan']),
        totalPemakaian: _toInt(json['total_pemakaian']),
        totalTagihan: _toInt(json['total_tagihan']),
      );
    } catch (e) {
      print('Error parsing RekapPerBulan: $e');
      rethrow;
    }
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static String _getBulanName(int bulan) {
    // Match backend getNamaBulan function exactly
    const bulanIndonesia = {
      1: 'Jan',
      2: 'Feb',
      3: 'Mar',
      4: 'Apr',
      5: 'Mei',
      6: 'Jun',
      7: 'Jul',
      8: 'Agu',
      9: 'Sep',
      10: 'Okt',
      11: 'Nov',
      12: 'Des',
    };

    return bulanIndonesia[bulan] ?? '-';
  }
}

// Keep old models for backwards compatibility if needed
class StatistikModel {
  final int totalPencatatan;
  final int pencatatanHariIni;
  final int pencatatanBulanIni;
  final int totalPemakaianTercatat;
  final int totalTagihanDihasilkan;
  final int tagihanHariIni;
  final int pemakaianHariIni;
  final int totalPelangganUnik;

  StatistikModel({
    required this.totalPencatatan,
    required this.pencatatanHariIni,
    required this.pencatatanBulanIni,
    required this.totalPemakaianTercatat,
    required this.totalTagihanDihasilkan,
    required this.tagihanHariIni,
    required this.pemakaianHariIni,
    required this.totalPelangganUnik,
  });

  factory StatistikModel.fromJson(Map<String, dynamic> json) {
    return StatistikModel(
      totalPencatatan: _toInt(json['total_pencatatan']),
      pencatatanHariIni: _toInt(json['pencatatan_hari_ini']),
      pencatatanBulanIni: _toInt(json['pencatatan_bulan_ini']),
      totalPemakaianTercatat: _toInt(json['total_pemakaian_tercatat']),
      totalTagihanDihasilkan: _toInt(json['total_tagihan_dihasilkan']),
      tagihanHariIni: _toInt(json['tagihan_hari_ini']),
      pemakaianHariIni: _toInt(json['pemakaian_hari_ini']),
      totalPelangganUnik: _toInt(json['total_pelanggan_unik']),
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }
}

class AktivitasTerakhir {
  final String pelanggan;
  final int bulan;
  final int tahun;
  final int meterAwal;
  final int meterAkhir;
  final int pemakaian;
  final String waktu;

  AktivitasTerakhir({
    required this.pelanggan,
    required this.bulan,
    required this.tahun,
    required this.meterAwal,
    required this.meterAkhir,
    required this.pemakaian,
    required this.waktu,
  });

  factory AktivitasTerakhir.fromJson(Map<String, dynamic> json) {
    return AktivitasTerakhir(
      pelanggan: json['pelanggan'] ?? '',
      bulan: json['bulan'] ?? 0,
      tahun: json['tahun'] ?? 0,
      meterAwal: json['meter_awal'] ?? 0,
      meterAkhir: json['meter_akhir'] ?? 0,
      pemakaian: json['pemakaian'] ?? 0,
      waktu: json['waktu'] ?? '',
    );
  }
}

class GrafikModel {
  final String periode;
  final int total;

  GrafikModel({
    required this.periode,
    required this.total,
  });

  factory GrafikModel.fromJson(Map<String, dynamic> json) {
    return GrafikModel(
      periode: json['periode'] ?? '',
      total: json['total'] ?? 0,
    );
  }
}

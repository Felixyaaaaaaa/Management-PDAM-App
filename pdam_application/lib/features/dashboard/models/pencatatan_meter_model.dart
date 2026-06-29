class PencatatanMeterModel {
  final int pelangganId;
  final String kodePelanggan;
  final String nama;
  final String alamat;
  final int pencatatanId;
  final String bulan;
  final String tahun;
  final int meterAwal;
  final int meterAkhir;
  final int pemakaian;
  final String statusPencatatan;
  final int tagihanId;
  final String totalTagihan;
  final String statusTagihan;
  final bool isEditable;

  PencatatanMeterModel({
    required this.pelangganId,
    required this.kodePelanggan,
    required this.nama,
    required this.alamat,
    required this.pencatatanId,
    required this.bulan,
    required this.tahun,
    required this.meterAwal,
    required this.meterAkhir,
    required this.pemakaian,
    required this.statusPencatatan,
    required this.tagihanId,
    required this.totalTagihan,
    required this.statusTagihan,
    required this.isEditable,
  });

  factory PencatatanMeterModel.fromJson(Map<String, dynamic> json) {
    return PencatatanMeterModel(
      pelangganId: _toInt(json['pelanggan_id']),
      kodePelanggan: json['kode_pelanggan']?.toString() ?? '',
      nama: json['nama']?.toString() ?? '',
      alamat: json['alamat']?.toString() ?? '',
      pencatatanId: _toInt(json['pencatatan_id']),
      bulan: json['bulan']?.toString() ?? '',
      tahun: json['tahun']?.toString() ?? '',
      meterAwal: _toInt(json['meter_awal']),
      meterAkhir: _toInt(json['meter_akhir']),
      pemakaian: _toInt(json['pemakaian']),
      statusPencatatan: json['status_pencatatan']?.toString() ?? '',
      tagihanId: _toInt(json['tagihan_id']),
      totalTagihan: json['total_tagihan']?.toString() ?? '0',
      statusTagihan: json['status_tagihan']?.toString() ?? '',
      isEditable: json['is_editable'] == 1 || json['is_editable'] == true,
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}

import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';
import '../../features/dashboard/models/pencatatan_meter_model.dart';

class PrinterService {
  static Future<bool> isBluetoothEnabled() async {
    return await PrintBluetoothThermal.bluetoothEnabled;
  }

  static Future<List<BluetoothInfo>> getPairedDevices() async {
    // Pada versi 1.2.1 package print_bluetooth_thermal, propertinya adalah pairedBluetooths
    return await PrintBluetoothThermal.pairedBluetooths;
  }

  static Future<bool> connect(String macAddress) async {
    return await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
  }

  static Future<bool> printReceipt(PencatatanMeterModel item, String metode) async {
    bool isConnected = await PrintBluetoothThermal.connectionStatus;
    if (!isConnected) return false;

    List<int> bytes = await _generateReceipt(item, metode);
    return await PrintBluetoothThermal.writeBytes(bytes);
  }

  static Future<List<int>> _generateReceipt(PencatatanMeterModel item, String metode) async {
    final profile = await CapabilityProfile.load();
    // PERBAIKAN: Gunakan PaperSize (bukan PosPaperSize)
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    final currencyFormat = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    bytes += generator.text('Pengelolaan Air Bersih',
        styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.text('"TIRTO WENING"',
        styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2, width: PosTextSize.size2));
    bytes += generator.text('Sugihwaras RW 07', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('--------------------------------', styles: const PosStyles(align: PosAlign.center));
    
    bytes += generator.text('STRUK PEMBAYARAN', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.feed(1);

    bytes += generator.text('Tanggal   : ${dateFormat.format(DateTime.now())}');
    bytes += generator.text('Pelanggan : ${item.nama}');
    bytes += generator.text('ID Pel    : ${item.kodePelanggan}');
    bytes += generator.text('Alamat    : ${item.alamat}');
    bytes += generator.text('Periode   : ${item.bulan}/${item.tahun}');
    bytes += generator.text('--------------------------------');

    bytes += generator.text('Meter Awal  : ${item.meterAwal} m3');
    bytes += generator.text('Meter Akhir : ${item.meterAkhir} m3');
    bytes += generator.text('Pemakaian   : ${item.pemakaian} m3');
    bytes += generator.text('--------------------------------');

    bytes += generator.text('Total Bayar : ${currencyFormat.format(double.tryParse(item.totalTagihan) ?? 0)}',
        styles: const PosStyles(bold: true));
    bytes += generator.text('Metode      : $metode');
    bytes += generator.feed(1);

    bytes += generator.text('STATUS: LUNAS', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.feed(1);
    
    bytes += generator.text('Terima Kasih', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('Simpan struk ini sebagai bukti', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('pembayaran yang sah.', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(1);
    bytes += generator.text('design by RHINNO', styles: const PosStyles(align: PosAlign.center));
    
    bytes += generator.cut();
    return bytes;
  }
}

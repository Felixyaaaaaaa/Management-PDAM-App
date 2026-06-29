import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../models/pencatatan_meter_model.dart';
import '../repositories/pencatatan_repository.dart';
import '../providers/dashboard_provider.dart';
import '../../../core/utils/printer_service.dart';

class DetailPencatatanPage extends ConsumerStatefulWidget {
  final PencatatanMeterModel item;
  const DetailPencatatanPage({super.key, required this.item});

  @override
  ConsumerState<DetailPencatatanPage> createState() => _DetailPencatatanPageState();
}

class _DetailPencatatanPageState extends ConsumerState<DetailPencatatanPage> {
  late PencatatanMeterModel _currentItem;
  final _meterController = TextEditingController();
  bool _isLoading = false;
  String _lastMetode = 'Cash';

  @override
  void initState() {
    super.initState();
    _currentItem = widget.item;
    _meterController.text = _currentItem.meterAkhir.toString();
  }

  @override
  void dispose() {
    _meterController.dispose();
    super.dispose();
  }

  Future<void> _refreshData() async {
    setState(() => _isLoading = true);
    try {
      final repo = PencatatanRepository();
      final tagihanResponse = await repo.getTagihanById(_currentItem.tagihanId);
      
      setState(() {
        _currentItem = PencatatanMeterModel(
          pelangganId: _currentItem.pelangganId,
          kodePelanggan: _currentItem.kodePelanggan,
          nama: _currentItem.nama,
          alamat: _currentItem.alamat,
          pencatatanId: _currentItem.pencatatanId,
          bulan: _currentItem.bulan,
          tahun: _currentItem.tahun,
          meterAwal: _currentItem.meterAwal,
          meterAkhir: _currentItem.meterAkhir,
          pemakaian: _currentItem.pemakaian,
          statusPencatatan: _currentItem.statusPencatatan,
          tagihanId: _currentItem.tagihanId,
          totalTagihan: tagihanResponse['total_tagihan']?.toString() ?? _currentItem.totalTagihan,
          statusTagihan: tagihanResponse['status']?.toString() ?? _currentItem.statusTagihan,
          isEditable: _currentItem.isEditable,
        );
      });
      ref.invalidate(listPetugasProvider);
    } catch (e) {
      debugPrint('Error refreshing data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateMeter() async {
    if (_meterController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Meter akhir tidak boleh kosong')),
      );
      return;
    }

    final meterAkhir = int.tryParse(_meterController.text);
    if (meterAkhir == null || meterAkhir < _currentItem.meterAwal) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Meter akhir tidak valid atau kurang dari meter awal')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repo = PencatatanRepository();
      await repo.updateMeter(_currentItem.pencatatanId, meterAkhir);
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pencatatan meter berhasil diperbarui')),
      );
      
      final pemakaianBaru = meterAkhir - _currentItem.meterAwal;
      setState(() {
        _currentItem = PencatatanMeterModel(
          pelangganId: _currentItem.pelangganId,
          kodePelanggan: _currentItem.kodePelanggan,
          nama: _currentItem.nama,
          alamat: _currentItem.alamat,
          pencatatanId: _currentItem.pencatatanId,
          bulan: _currentItem.bulan,
          tahun: _currentItem.tahun,
          meterAwal: _currentItem.meterAwal,
          meterAkhir: meterAkhir,
          pemakaian: pemakaianBaru,
          statusPencatatan: 'sudah_dicatat',
          tagihanId: _currentItem.tagihanId,
          totalTagihan: _currentItem.totalTagihan,
          statusTagihan: _currentItem.statusTagihan,
          isEditable: _currentItem.isEditable,
        );
      });

      await _refreshData();
      
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showPaymentDialog() async {
    final totalTagihan = double.tryParse(_currentItem.totalTagihan) ?? 0;
    final TextEditingController bayarController = TextEditingController(text: totalTagihan.toInt().toString());
    String selectedMetode = 'Cash';

    return showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Proses Pembayaran'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Pelanggan: ${_currentItem.nama}'),
                  const SizedBox(height: 8),
                  Text(
                    'Total Tagihan: ${NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0).format(totalTagihan)}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const Divider(),
                  const Text('Metode Pembayaran', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  DropdownButton<String>(
                    value: selectedMetode,
                    isExpanded: true,
                    items: ['Cash', 'Transfer Bank'].map((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(value),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() => selectedMetode = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  const Text('Jumlah Bayar', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  TextField(
                    controller: bayarController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Rp ',
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal'),
                ),
                ElevatedButton(
                  onPressed: _isLoading ? null : () async {
                    final jumlah = double.tryParse(bayarController.text) ?? 0;
                    if (jumlah < totalTagihan) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Jumlah bayar tidak boleh kurang dari total tagihan')),
                      );
                      return;
                    }
                    
                    Navigator.pop(context);
                    await _processPayment(jumlah, selectedMetode);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  child: const Text('Bayar'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _processPayment(double jumlah, String metode) async {
    setState(() {
      _isLoading = true;
      _lastMetode = metode;
    });
    try {
      final repo = PencatatanRepository();
      await repo.bayarTagihan(
        tagihanId: _currentItem.tagihanId,
        jumlahBayar: jumlah,
        metode: metode,
      );
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pembayaran berhasil diproses')),
      );
      
      await _refreshData();
      
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal bayar: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handlePrint() async {
    // 1. Request Bluetooth Permissions
    if (await Permission.bluetoothScan.request().isDenied ||
        await Permission.bluetoothConnect.request().isDenied ||
        await Permission.location.request().isDenied) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Izin Bluetooth/Lokasi diperlukan untuk mencetak')),
      );
      return;
    }

    // 2. Check if Bluetooth is enabled
    bool isBluetoothEnabled = await PrinterService.isBluetoothEnabled();
    if (!isBluetoothEnabled) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aktifkan Bluetooth Anda')),
      );
      return;
    }

    // 3. Check Connection
    bool isConnected = await PrintBluetoothThermal.connectionStatus;
    if (!isConnected) {
      final BluetoothInfo? selectedDevice = await _showDeviceSelectionDialog();
      if (selectedDevice != null) {
        setState(() => _isLoading = true);
        bool connectSuccess = await PrinterService.connect(selectedDevice.macAdress);
        setState(() => _isLoading = false);
        
        if (!connectSuccess) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gagal menghubungkan ke printer')),
          );
          return;
        }
      } else {
        return;
      }
    }

    // 4. Print Receipt
    setState(() => _isLoading = true);
    bool printResult = await PrinterService.printReceipt(_currentItem, _lastMetode);
    setState(() => _isLoading = false);

    if (!mounted) return;
    if (printResult) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Struk berhasil dicetak')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal mencetak struk')),
      );
    }
  }

  Future<BluetoothInfo?> _showDeviceSelectionDialog() async {
    List<BluetoothInfo> devices = await PrinterService.getPairedDevices();
    
    if (!mounted) return null;
    
    return await showDialog<BluetoothInfo>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Pilih Printer Bluetooth'),
        content: devices.isEmpty 
          ? const Text('Tidak ada perangkat Bluetooth tersambung. Pastikan printer sudah dipairing.')
          : SizedBox(
              width: double.maxFinite,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: devices.length,
                itemBuilder: (context, index) {
                  final device = devices[index];
                  return ListTile(
                    leading: const Icon(Icons.print),
                    title: Text(device.name),
                    subtitle: Text(device.macAdress),
                    onTap: () => Navigator.pop(context, device),
                  );
                },
              ),
            ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);
    
    final bool isPaid = _currentItem.statusTagihan == 'lunas' || _currentItem.statusTagihan == 'paid';
    final bool canEdit = _currentItem.isEditable && !isPaid;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail & Bayar'),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info Pelanggan
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Informasi Pelanggan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const Divider(),
                        _infoRow('Nama', _currentItem.nama),
                        _infoRow('Kode', _currentItem.kodePelanggan),
                        _infoRow('Alamat', _currentItem.alamat),
                        _infoRow('Periode', '${_currentItem.bulan} / ${_currentItem.tahun}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Input Meteran
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Pencatatan Meter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const Divider(),
                        _infoRow('Meter Awal', '${_currentItem.meterAwal} m³'),
                        const SizedBox(height: 12),
                        const Text('Meter Akhir', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 4),
                        TextField(
                          controller: _meterController,
                          keyboardType: TextInputType.number,
                          enabled: canEdit,
                          decoration: InputDecoration(
                            hintText: 'Masukkan meter akhir',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            suffixText: 'm³',
                            filled: !canEdit,
                            fillColor: Colors.grey[100],
                          ),
                        ),
                        if (!_currentItem.isEditable && !isPaid)
                          const Padding(
                            padding: EdgeInsets.only(top: 8),
                            child: Text(
                              '* Pencatatan dikunci karena daftar bulan berikutnya sudah tersedia.',
                              style: TextStyle(color: Colors.red, fontSize: 12, fontStyle: FontStyle.italic),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Ringkasan Tagihan
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Ringkasan Tagihan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const Divider(),
                        _infoRow('Pemakaian', '${_currentItem.pemakaian} m³'),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Status Tagihan', style: TextStyle(color: Colors.grey)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isPaid ? Colors.blue.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _currentItem.statusTagihan.toUpperCase(),
                                style: TextStyle(
                                  color: isPaid ? Colors.blue : Colors.orange,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total Tagihan', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text(
                              currencyFormat.format(double.tryParse(_currentItem.totalTagihan) ?? 0),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blueAccent),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                if (canEdit)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _updateMeter,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('SIMPAN PENCATATAN', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                
                const SizedBox(height: 12),
                
                if (!isPaid && _currentItem.meterAkhir > 0)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _showPaymentDialog,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('PROSES BAYAR SEKARANG', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  
                if (isPaid)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton.icon(
                      onPressed: _isLoading ? null : _handlePrint,
                      icon: const Icon(Icons.print),
                      label: const Text('CETAK STRUK PEMBAYARAN', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.blueAccent),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

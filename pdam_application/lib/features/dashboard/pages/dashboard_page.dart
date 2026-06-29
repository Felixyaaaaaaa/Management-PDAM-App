import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/storage/secure_storage_service.dart';
import '../providers/dashboard_provider.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  String name = '';
  
  final List<String> months = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];
  
  final List<String> years = List.generate(
    5, 
    (index) => (DateTime.now().year - index).toString()
  );

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final result = await SecureStorageService.getName();
    setState(() {
      name = result ?? '';
    });
  }

  void _showProfileMenu() async {
    final email = await SecureStorageService.getEmail();
    final role = await SecureStorageService.getRole();

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Akun Petugas'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 35,
              backgroundColor: Colors.blueAccent,
              child: Icon(Icons.person, size: 40, color: Colors.white),
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(email ?? '', style: const TextStyle(color: Colors.grey, fontSize: 14)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blueAccent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                role?.toUpperCase() ?? '',
                style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 10),
              ),
            ),
            const Divider(height: 32),
            // TOMBOL MENUJU HALAMAN PROFIL
            ListTile(
              leading: const Icon(Icons.analytics_outlined, color: Colors.blueAccent),
              title: const Text('Statistik & Profil'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context); // Tutup dialog
                context.push('/profile'); // Pergi ke Profile Page
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Logout'),
              onTap: () {
                Navigator.pop(context);
                _logout();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _logout() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Apakah Anda yakin ingin logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (result == true) {
      await SecureStorageService.logout();
      if (mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final listPetugasAsync = ref.watch(filteredListPetugasProvider);
    final filters = ref.watch(dashboardFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 40,
              height: 40,
            ),
            const SizedBox(width: 12),

            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Text(
                  'Tirto Wening',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Sugihwaras RW 07',
                  style: TextStyle(
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _showProfileMenu,
            icon: const Icon(Icons.account_circle),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blueAccent.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Column(
              children: [
                TextField(
                  onChanged: (val) => ref.read(searchQueryProvider.notifier).state = val,
                  decoration: InputDecoration(
                    hintText: 'Cari Nama Pelanggan...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: filters['bulan'],
                        decoration: InputDecoration(
                          labelText: 'Bulan',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        items: months.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            ref.read(dashboardFilterProvider.notifier).state = {
                              ...filters,
                              'bulan': val,
                            };
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: filters['tahun'],
                        decoration: InputDecoration(
                          labelText: 'Tahun',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        items: years.map((y) => DropdownMenuItem(value: y, child: Text(y))).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            ref.read(dashboardFilterProvider.notifier).state = {
                              ...filters,
                              'tahun': val,
                            };
                          }
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Sort option added below month/tahun
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: ref.watch(dashboardStatusProvider),
                        decoration: InputDecoration(
                          labelText: 'Status',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'semua', child: Text('Semua')),
                          DropdownMenuItem(value: 'sudah_dicatat', child: Text('Sudah Dicatat')),
                          DropdownMenuItem(value: 'belum_dicatat', child: Text('Belum Dicatat')),
                          DropdownMenuItem(value: 'lunas', child: Text('Lunas')),
                          DropdownMenuItem(value: 'belum_bayar', child: Text('Belum Bayar')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            ref.read(dashboardStatusProvider.notifier).setStatus(val);
                          }
                        },
                      ),
                    ),
                  ],
                ),
               ],
             ),
           ),

          // List Section
          Expanded(
            child: listPetugasAsync.when(
              data: (data) {
                if (data.isEmpty) {
                  return const Center(
                    child: Text('Tidak ada data pencatatan.'),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(listPetugasProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: data.length,
                    itemBuilder: (context, index) {
                      final item = data[index];
                      final currencyFormat = NumberFormat.currency(
                        locale: 'id',
                        symbol: 'Rp ',
                        decimalDigits: 0,
                      );

                      final bool isRecorded = item.statusPencatatan == 'sudah_dicatat';
                      final bool isPaid = item.statusTagihan == 'lunas' || item.statusTagihan == 'paid';

                      return Card(
                        elevation: 3,
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            context.push('/detail-pencatatan', extra: item);
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item.nama,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isRecorded ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        isRecorded ? 'DICATAT' : 'BELUM DICATAT',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: isRecorded ? Colors.green : Colors.red,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'ID: ${item.kodePelanggan} | Alamat: ${item.alamat}',
                                  style: const TextStyle(fontSize: 13, color: Colors.grey),
                                ),
                                const Divider(height: 24),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Pemakaian', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text('${item.pemakaian} m³', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        const Text('Tagihan', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                        Text(
                                          currencyFormat.format(double.tryParse(item.totalTagihan) ?? 0),
                                          style: const TextStyle(
                                            color: Colors.blueAccent,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isPaid ? Colors.blue.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: isPaid ? Colors.blue : Colors.orange),
                                      ),
                                      child: Text(
                                        isPaid ? 'LUNAS' : 'BELUM BAYAR',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isPaid ? Colors.blue : Colors.orange,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
    );
  }
}

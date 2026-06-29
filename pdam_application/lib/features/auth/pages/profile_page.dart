import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../models/profile_model.dart';
import '../../../core/storage/secure_storage_service.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  String? selectedPeriode;

  @override
  Widget build(BuildContext context) {
    final ref = this.ref;
    final profileAsync = ref.watch(profileProvider);
    final currencyFormat = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Petugas'),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
      ),
      body: profileAsync.when(
        data: (profile) {
          // Initialize selected periode on first load
          if (selectedPeriode == null && profile.rekapPerBulan.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              setState(() {
                selectedPeriode = profile.rekapPerBulan.first.periode;
              });
            });
          }

          RekapPerBulan? selectedData;
          if (selectedPeriode != null && profile.rekapPerBulan.isNotEmpty) {
            try {
              selectedData = profile.rekapPerBulan.firstWhere(
                (item) => item.periode == selectedPeriode,
              );
            } catch (e) {
              selectedData = profile.rekapPerBulan.first;
            }
          } else if (profile.rekapPerBulan.isNotEmpty) {
            selectedData = profile.rekapPerBulan.first;
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(profileProvider.future),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Card
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 40,
                            backgroundColor: Colors.blueAccent,
                            child: Icon(Icons.person, size: 50, color: Colors.white),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.user.name,
                                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  profile.user.email,
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.blueAccent.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    profile.user.role.toUpperCase(),
                                    style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Ringkasan Section
                  const Text(
                    'Ringkasan Statistik',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.4,
                    children: [
                      _buildStatCard(
                        'Total Pencatatan',
                        profile.ringkasan.totalPencatatan.toString(),
                        Icons.assignment,
                        Colors.blue,
                      ),
                      _buildStatCard(
                        'Pelanggan Unik',
                        profile.ringkasan.totalPelangganUnik.toString(),
                        Icons.people,
                        Colors.purple,
                      ),
                      _buildStatCard(
                        'Total Pemakaian',
                        '${profile.ringkasan.totalPemakaian} m³',
                        Icons.water_drop,
                        Colors.cyan,
                      ),
                      _buildStatCard(
                        'Total Tagihan',
                        currencyFormat.format(profile.ringkasan.totalTagihan),
                        Icons.payments,
                        Colors.green,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Rekap Per Bulan Section
                  if (profile.rekapPerBulan.isNotEmpty) ...[
                    const Text(
                      'Rekap Per Bulan',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: selectedPeriode ?? (profile.rekapPerBulan.isNotEmpty ? profile.rekapPerBulan.first.periode : null),
                      decoration: InputDecoration(
                        labelText: 'Pilih Periode',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      items: profile.rekapPerBulan
                          .map((item) => DropdownMenuItem(value: item.periode, child: Text(item.periode)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            selectedPeriode = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    if (selectedData != null) ...[
                      Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Data ${selectedData.periode}',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              const Divider(height: 16),
                              _buildRecapTile(
                                'Jumlah Pencatatan',
                                selectedData.jumlahPencatatan.toString(),
                                Icons.assignment_turned_in,
                              ),
                              _buildRecapTile(
                                'Total Pemakaian',
                                '${selectedData.totalPemakaian} m³',
                                Icons.water_drop,
                              ),
                              _buildRecapTile(
                                'Total Tagihan',
                                currencyFormat.format(selectedData.totalTagihan),
                                Icons.monetization_on,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                  ],

                  // Logout Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton.icon(
                      onPressed: () => _showLogoutDialog(context),
                      icon: const Icon(Icons.logout),
                      label: const Text('KELUAR APLIKASI', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Gagal memuat profil: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(profileProvider),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildRecapTile(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.blueAccent, size: 20),
              const SizedBox(width: 12),
              Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey)),
            ],
          ),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _showLogoutDialog(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi'),
        content: const Text('Apakah Anda yakin ingin keluar dari aplikasi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (result == true) {
      await SecureStorageService.logout();
      if (context.mounted) context.go('/login');
    }
  }
}

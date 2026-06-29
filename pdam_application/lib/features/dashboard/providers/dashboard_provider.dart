import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/pencatatan_meter_model.dart';
import '../repositories/dashboard_repository.dart';
import '../../../core/storage/secure_storage_service.dart';

final dashboardRepositoryProvider = Provider((ref) => DashboardRepository());

final dashboardFilterProvider = StateProvider<Map<String, String>>((ref) {
  final now = DateTime.now();
  return {
    'bulan': now.month.toString().padLeft(2, '0'),
    'tahun': now.year.toString(),
  };
});

// Async provider to load dashboard status from secure storage
final dashboardStatusProvider = StateNotifierProvider<DashboardStatusNotifier, String>((ref) {
  return DashboardStatusNotifier();
});

class DashboardStatusNotifier extends StateNotifier<String> {
  DashboardStatusNotifier() : super('semua') {
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    final savedStatus = await SecureStorageService.getDashboardStatus();
    state = savedStatus ?? 'semua';
  }

  Future<void> setStatus(String newStatus) async {
    state = newStatus;
    await SecureStorageService.saveDashboardStatus(newStatus);
  }
}

final searchQueryProvider = StateProvider<String>((ref) => '');

final listPetugasProvider = FutureProvider<List<PencatatanMeterModel>>((ref) async {
  final filters = ref.watch(dashboardFilterProvider);
  final repository = ref.read(dashboardRepositoryProvider);

  return repository.getListPetugas(
    bulan: filters['bulan'],
    tahun: filters['tahun'],
  );
});

final filteredListPetugasProvider = Provider<AsyncValue<List<PencatatanMeterModel>>>((ref) {
  final listAsync = ref.watch(listPetugasProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase();
  final statusFilter = ref.watch(dashboardStatusProvider);

  return listAsync.whenData((list) {
    var filtered = list;
    if (query.isNotEmpty) {
      filtered = filtered.where((item) =>
        item.nama.toLowerCase().contains(query) ||
        item.kodePelanggan.toLowerCase().contains(query)
      ).toList();
    }

    // Apply status filtering
    switch (statusFilter) {
      case 'sudah_dicatat':
        filtered = filtered.where((i) => i.statusPencatatan == 'sudah_dicatat').toList();
        break;
      case 'belum_dicatat':
        filtered = filtered.where((i) => i.statusPencatatan != 'sudah_dicatat').toList();
        break;
      case 'lunas':
        filtered = filtered.where((i) => (i.statusTagihan == 'lunas' || i.statusTagihan == 'paid')).toList();
        break;
      case 'belum_bayar':
        filtered = filtered.where((i) => !(i.statusTagihan == 'lunas' || i.statusTagihan == 'paid')).toList();
        break;
      case 'semua':
      default:
        break;
    }

    // Default sorting by name ascending for consistent UX
    filtered.sort((a, b) => a.nama.toLowerCase().compareTo(b.nama.toLowerCase()));

    return filtered;
  });
});


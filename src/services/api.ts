import { Doctor, Service, Appointment, Prescription, AppointmentStatus, StaffSession, Tenant, Clinic, Shift, DebtRecord } from '../types';
import { DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS, CLINICS, TENANTS } from '../data/mockData';
import { supabase } from './supabaseClient';

export interface TenantRegisterPayload {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  firstBranchName?: string;
  firstBranchAddress?: string;
  ownerPin?: string;
  staffPin?: string;
}

export interface TenantRegisterResult {
  ok: boolean;
  tenant?: Tenant;
  branch?: Clinic;
  ownerPin?: string;
  staffPin?: string;
  error?: string;
}

// -------------------------------------------------------------
// LOCAL CACHE & STORAGE (OFFLINE FALLBACK)
// -------------------------------------------------------------
export function getStoredTenants(): Tenant[] {
  try {
    const custom = JSON.parse(localStorage.getItem('dentamed_custom_tenants') || '[]');
    return [...TENANTS, ...custom];
  } catch {
    return TENANTS;
  }
}

export function getStoredClinics(): Clinic[] {
  try {
    const custom = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    return [...CLINICS, ...custom];
  } catch {
    return CLINICS;
  }
}

export function saveCustomTenantLocally(tenant: Tenant, branch: Clinic) {
  try {
    const customTenants: Tenant[] = JSON.parse(localStorage.getItem('dentamed_custom_tenants') || '[]');
    if (!customTenants.some(t => t.id === tenant.id)) {
      customTenants.push(tenant);
      localStorage.setItem('dentamed_custom_tenants', JSON.stringify(customTenants));
    }

    const customClinics: Clinic[] = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    if (!customClinics.some(c => c.id === branch.id)) {
      customClinics.push(branch);
      localStorage.setItem('dentamed_custom_clinics', JSON.stringify(customClinics));
    }
  } catch (e) {
    console.error('Error storing custom tenant locally', e);
  }
}

export function addNewBranchLocally(branch: Clinic) {
  try {
    const customClinics: Clinic[] = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    customClinics.push(branch);
    localStorage.setItem('dentamed_custom_clinics', JSON.stringify(customClinics));
  } catch (e) {
    console.error('Error adding branch locally', e);
  }
}

export function getAllExistingPins(): string[] {
  const tenants = getStoredTenants();
  const clinics = getStoredClinics();
  const pins: string[] = ['7777'];
  tenants.forEach((t: any) => {
    if (t.ownerPin) pins.push(String(t.ownerPin).trim());
  });
  clinics.forEach((c: any) => {
    if (c.staffPin) pins.push(String(c.staffPin).trim());
  });
  return Array.from(new Set(pins));
}

export function isPinAlreadyTaken(pin: string): boolean {
  if (!pin || !pin.trim()) return false;
  const clean = pin.trim();
  return getAllExistingPins().includes(clean);
}

export function generateUniqueRandomPin(): string {
  const existingPins = getAllExistingPins();
  let candidate = '';
  let attempts = 0;
  do {
    candidate = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (existingPins.includes(candidate) && attempts < 200);
  return candidate;
}

// -------------------------------------------------------------
// TENANT REGISTRATION (SUPABASE + LOCAL STORAGE)
// -------------------------------------------------------------
export async function registerTenant(payload: TenantRegisterPayload): Promise<TenantRegisterResult> {
  const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || ('tenant' + Date.now().toString().slice(-4));
  let ownerPin = payload.ownerPin ? payload.ownerPin.trim() : '';
  let staffPin = payload.staffPin ? payload.staffPin.trim() : '';

  if (!ownerPin || isPinAlreadyTaken(ownerPin)) {
    ownerPin = generateUniqueRandomPin();
  }
  if (!staffPin || isPinAlreadyTaken(staffPin) || staffPin === ownerPin) {
    staffPin = generateUniqueRandomPin();
  }
  const branchId = slug + '-main';

  const newTenant: Tenant = {
    id: slug,
    name: payload.name,
    tagline: {
      uz: payload.name + ' Zamonaviy Tibbiyot Markazi (14 kun bepul)',
      ru: 'Современный Медицинский Центр ' + payload.name
    },
    badge: 'Yangi Hamkor',
    defaultBranchId: branchId
  };

  (newTenant as any).ownerPin = ownerPin;
  (newTenant as any).ownerName = payload.ownerName;
  (newTenant as any).phone = payload.phone;

  const newBranch: Clinic = {
    id: branchId,
    tenantId: slug,
    name: payload.firstBranchName || (payload.name + ' (Bosh filial)'),
    branchName: {
      uz: payload.firstBranchName || (payload.name + ' Bosh filial'),
      ru: payload.firstBranchName || ('Головной филиал ' + payload.name)
    },
    city: { uz: 'Toshkent', ru: 'Ташкент' },
    address: {
      uz: payload.firstBranchAddress || "Toshkent shahar, Markaziy ko'cha, 1-bino",
      ru: payload.firstBranchAddress || 'г. Ташкент, ул. Центральная, 1'
    },
    landmark: { uz: "Markaziy mo'ljal", ru: 'Центральный ориентир' },
    phone: payload.phone,
    workingHours: {
      uz: '08:00 - 20:00 (Har kuni)',
      ru: '08:00 - 20:00 (Без выходных)'
    },
    badge: '1-Filial',
    isMain: true,
    staffPin: staffPin,
    managerName: payload.ownerName
  };

  saveCustomTenantLocally(newTenant, newBranch);

  // Sync to live Supabase Database
  try {
    await supabase.from('tenants').insert({
      id: newTenant.id,
      name: newTenant.name,
      tagline_uz: newTenant.tagline.uz,
      tagline_ru: newTenant.tagline.ru,
      badge: newTenant.badge,
      owner_pin: ownerPin,
      default_branch_id: newBranch.id
    });

    await supabase.from('clinics').insert({
      id: newBranch.id,
      tenant_id: newTenant.id,
      name: newBranch.name,
      branch_name_uz: newBranch.branchName.uz,
      branch_name_ru: newBranch.branchName.ru,
      address_uz: newBranch.address.uz,
      address_ru: newBranch.address.ru,
      phone: newBranch.phone,
      working_hours_uz: newBranch.workingHours.uz,
      is_main: true,
      staff_pin: staffPin,
      manager_name: payload.ownerName
    });
  } catch (err) {
    console.warn('Supabase tenant registration synced locally only', err);
  }

  return {
    ok: true,
    tenant: newTenant,
    branch: newBranch,
    ownerPin: ownerPin,
    staffPin: staffPin
  };
}

// -------------------------------------------------------------
// STAFF LOGIN (SUPABASE + LOCAL VALIDATION)
// -------------------------------------------------------------
export async function loginStaff(pin: string): Promise<{ ok: boolean; session?: StaffSession; error?: string }> {
  const cleanPin = pin.trim();

  // 1. Try Live Supabase verification
  try {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_pin', cleanPin)
      .maybeSingle();

    if (tenantData) {
      const { data: branchData } = await supabase
        .from('clinics')
        .select('*')
        .eq('tenant_id', tenantData.id);

      const branchIds = (branchData || []).map((b: any) => b.id);
      return {
        ok: true,
        session: {
          role: 'clinic_director',
          tenantId: tenantData.id,
          staffName: 'Klinika Rahbari',
          titleUz: '👑 ' + tenantData.name + ' Rahbari (Barcha filiallar)',
          titleRu: '👑 Руководитель ' + tenantData.name + ' (Все филиалы)',
          isDirector: true,
          allowedClinicIds: branchIds.length > 0 ? branchIds : [tenantData.default_branch_id || 'nukus']
        }
      };
    }

    const { data: clinicData } = await supabase
      .from('clinics')
      .select('*')
      .eq('staff_pin', cleanPin)
      .maybeSingle();

    if (clinicData) {
      return {
        ok: true,
        session: {
          role: 'reception',
          tenantId: clinicData.tenant_id || 'dentamed',
          clinicId: clinicData.id,
          staffName: clinicData.manager_name || 'Retsepshn xodimi',
          titleUz: '📍 ' + (clinicData.branch_name_uz || clinicData.name) + ' Retsepshni',
          titleRu: '📍 Ресепшн ' + (clinicData.branch_name_ru || clinicData.name),
          isDirector: false,
          allowedClinicIds: [clinicData.id]
        }
      };
    }
  } catch (e) {
    console.warn('Live Supabase login check failed, falling back to local storage', e);
  }

  // 2. Offline Fallback
  const allTenants = getStoredTenants();
  const allClinics = getStoredClinics();

  for (const t of allTenants) {
    const ownerPin = (t as any).ownerPin ? String((t as any).ownerPin).trim() : '';
    if (ownerPin && ownerPin === cleanPin) {
      const branches = allClinics.filter(c => c.tenantId === t.id);
      const session: StaffSession = {
        role: 'clinic_director',
        tenantId: t.id,
        staffName: (t as any).ownerName || 'Klinika Rahbari',
        titleUz: '👑 ' + t.name + ' Rahbari (Barcha filiallar)',
        titleRu: '👑 Руководитель ' + t.name + ' (Все филиалы)',
        isDirector: true,
        allowedClinicIds: branches.map(b => b.id)
      };
      return { ok: true, session };
    }
  }

  const matchedBranch = allClinics.find(c => c.staffPin === cleanPin);
  if (matchedBranch) {
    const session: StaffSession = {
      role: 'reception',
      tenantId: matchedBranch.tenantId || 'dentamed',
      clinicId: matchedBranch.id,
      staffName: matchedBranch.managerName || 'Retsepshn xodimi',
      titleUz: '📍 ' + matchedBranch.branchName.uz + ' Retsepshni',
      titleRu: '📍 Ресепшн ' + matchedBranch.branchName.ru,
      isDirector: false,
      allowedClinicIds: [matchedBranch.id]
    };
    return { ok: true, session };
  }

  return {
    ok: false,
    error: "Noto'g'ri PIN-kod! Iltimos, qaytadan urinib ko'ring."
  };
}

// -------------------------------------------------------------
// DOCTORS & SERVICES
// -------------------------------------------------------------
export function getStoredDoctors(): Doctor[] {
  try {
    const custom: Doctor[] = JSON.parse(localStorage.getItem('dentamed_custom_doctors') || '[]');
    return [...DOCTORS, ...custom];
  } catch {
    return DOCTORS;
  }
}

export function saveDoctorLocally(doctor: Doctor) {
  try {
    const custom: Doctor[] = JSON.parse(localStorage.getItem('dentamed_custom_doctors') || '[]');
    const existingIdx = custom.findIndex(d => d.id === doctor.id);
    if (existingIdx >= 0) {
      custom[existingIdx] = doctor;
    } else {
      custom.push(doctor);
    }
    localStorage.setItem('dentamed_custom_doctors', JSON.stringify(custom));
  } catch (e) {
    console.error('Error saving doctor locally', e);
  }
}

export function deleteDoctorLocally(id: number) {
  try {
    let custom: Doctor[] = JSON.parse(localStorage.getItem('dentamed_custom_doctors') || '[]');
    custom = custom.filter(d => d.id !== id);
    localStorage.setItem('dentamed_custom_doctors', JSON.stringify(custom));
  } catch (e) {
    console.error('Error deleting doctor locally', e);
  }
}

export async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const { data, error } = await supabase.from('doctors').select('*');
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        tenantId: d.tenant_id,
        name: d.name,
        specialty: {
          uz: d.specialty_uz || d.name,
          ru: d.specialty_ru || d.name
        },
        department: d.department || 'stomatology',
        experience: d.experience || 5,
        rating: Number(d.rating) || 5.0,
        reviewsCount: d.reviews_count || 0,
        photo: d.photo || '',
        availableDays: d.available_days || ['dush', 'sesh', 'chor', 'pay', 'juma', 'shan'],
        clinicIds: d.clinic_ids || ['nukus']
      }));
    }
  } catch (e) {
    console.warn('Supabase doctors fetch fallback to local', e);
  }
  return getStoredDoctors();
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase.from('services').select('*');
    if (!error && data && data.length > 0) {
      return data.map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id,
        department: s.department || 'stomatology',
        category: {
          uz: s.category_uz || 'Umumiy',
          ru: s.category_ru || 'Общее'
        },
        title: {
          uz: s.title_uz,
          ru: s.title_ru || s.title_uz
        },
        desc: {
          uz: s.desc_uz || '',
          ru: s.desc_ru || ''
        },
        price: Number(s.price) || 0,
        duration: s.duration || 30,
        isPopular: s.is_popular || false,
        clinicIds: s.clinic_ids || ['nukus']
      }));
    }
  } catch (e) {
    console.warn('Supabase services fetch fallback to local', e);
  }
  return SERVICES;
}

// -------------------------------------------------------------
// APPOINTMENTS (SUPABASE + LOCAL STORAGE)
// -------------------------------------------------------------
export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const liveAppts: Appointment[] = data.map((row: any) => ({
        id: row.id,
        pinCode: row.pin_code,
        patientName: row.patient_name,
        phone: row.phone,
        doctor: {
          id: row.doctor_id || 1,
          name: row.doctor_name || 'Dr. Shifokor',
          tenantId: row.tenant_id,
          department: row.department || 'stomatology',
          specialty: { uz: 'Stomatolog', ru: 'Стоматолог' },
          experience: 5,
          rating: 5,
          reviewsCount: 10,
          photo: '',
          availableDays: ['dush', 'sesh', 'chor', 'pay', 'juma', 'shan']
        },
        service: {
          id: row.service_id || 1,
          department: row.department || 'stomatology',
          category: { uz: 'Xizmat', ru: 'Услуга' },
          title: { uz: row.service_name || 'Konsultatsiya', ru: row.service_name || 'Консультация' },
          desc: { uz: '', ru: '' },
          price: Number(row.total_amount) || 0,
          duration: 30
        },
        date: row.appointment_date,
        time: row.appointment_time,
        status: row.status as AppointmentStatus,
        notes: row.notes,
        createdAt: row.created_at,
        selectedTeethNumbers: row.selected_teeth,
        totalAmount: Number(row.total_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        debtAmount: Number(row.debt_amount) || 0,
        paymentStatus: row.payment_status || 'unpaid',
        paymentMethod: row.payment_method,
        department: row.department || 'stomatology',
        clinicId: row.clinic_id
      }));

      localStorage.setItem('dentamed_reception_appts', JSON.stringify(liveAppts));
      return liveAppts;
    }
  } catch (e) {
    console.warn('Could not fetch appointments from Supabase', e);
  }

  try {
    const saved = localStorage.getItem('dentamed_reception_appts');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return INITIAL_RECEPTION_APPOINTMENTS;
}

export async function saveAppointment(appt: Appointment): Promise<boolean> {
  // 1. Cache locally first
  try {
    const saved = JSON.parse(localStorage.getItem('dentamed_reception_appts') || '[]');
    const updated = [appt, ...saved.filter((a: Appointment) => a.id !== appt.id)];
    localStorage.setItem('dentamed_reception_appts', JSON.stringify(updated));
  } catch (e) {
    console.warn('Local save error', e);
  }

  // 2. Persist to live Supabase Database
  try {
    const { error } = await supabase.from('appointments').upsert({
      id: appt.id,
      pin_code: appt.pinCode,
      tenant_id: appt.doctor?.tenantId || 'dentamed',
      clinic_id: appt.clinicId || 'nukus',
      patient_name: appt.patientName,
      phone: appt.phone,
      doctor_id: appt.doctor?.id || null,
      doctor_name: appt.doctor?.name || 'Shifokor',
      service_id: appt.service?.id || null,
      service_name: appt.service?.title?.uz || appt.service?.title?.ru || 'Xizmat',
      appointment_date: appt.date,
      appointment_time: appt.time,
      status: appt.status || 'confirmed',
      notes: appt.notes || '',
      total_amount: appt.totalAmount || 0,
      paid_amount: appt.paidAmount || 0,
      debt_amount: appt.debtAmount || 0,
      payment_status: appt.paymentStatus || 'unpaid',
      payment_method: appt.paymentMethod || null,
      selected_teeth: appt.selectedTeethNumbers || [],
      department: appt.department || 'stomatology',
      created_at: appt.createdAt || new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to sync appointment with Supabase', e);
    return false;
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (error) console.warn('Supabase status update warning:', error);
  } catch (e) {
    console.warn('Could not update appointment status on server', e);
  }

  try {
    const saved: Appointment[] = JSON.parse(localStorage.getItem('dentamed_reception_appts') || '[]');
    const updated = saved.map(a => a.id === appointmentId ? { ...a, status } : a);
    localStorage.setItem('dentamed_reception_appts', JSON.stringify(updated));
  } catch {}

  return true;
}

export async function fetchBusySlots(
  doctorId: number,
  date: string,
  _clinicId?: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['confirmed', 'waiting', 'in_progress']);

    if (!error && data) {
      return data.map((d: any) => d.appointment_time);
    }
  } catch (e) {
    console.warn('Could not fetch busy slots from Supabase', e);
  }
  return [];
}

// -------------------------------------------------------------
// SHIFTS & Z-REPORTS
// -------------------------------------------------------------
export async function syncShiftToSupabase(shift: Shift): Promise<boolean> {
  try {
    const { error } = await supabase.from('shifts').upsert({
      id: shift.id,
      tenant_id: shift.tenantId || 'dentamed',
      clinic_id: shift.clinicId || 'nukus',
      cashier_name: shift.cashierName,
      starting_cash: shift.startingCash || 0,
      opened_at: shift.openedAt,
      closed_at: shift.closedAt || null,
      status: shift.status || 'open',
      expected_cash: shift.expectedCash || 0,
      actual_cash: shift.actualCash || 0,
      difference: shift.difference || 0,
      total_revenue: shift.totalRevenue || 0,
      cash_revenue: shift.cashRevenue || 0,
      card_revenue: shift.cardRevenue || 0,
      online_revenue: shift.onlineRevenue || 0,
      total_expense: shift.totalExpense || 0,
      appointments_count: shift.appointmentsCount || 0,
      notes: shift.notes || null
    });
    return !error;
  } catch (e) {
    console.warn('Shift sync failed', e);
    return false;
  }
}

// -------------------------------------------------------------
// PRESCRIPTIONS & DEBTS
// -------------------------------------------------------------
export async function sendPrescription(prescription: Prescription): Promise<{ ok: boolean; message?: string }> {
  try {
    const { error } = await supabase.from('prescriptions').upsert({
      id: prescription.id,
      appointment_id: prescription.appointmentId || null,
      pin_code: prescription.pinCode,
      tenant_id: 'dentamed',
      clinic_id: prescription.clinicId || 'nukus',
      patient_name: prescription.patientName,
      phone: prescription.phone,
      doctor_name: prescription.doctorName,
      medicines: prescription.medicines,
      recommendations: prescription.recommendations,
      custom_notes: prescription.customNotes || null
    });

    if (!error) {
      return { ok: true, message: 'Retsept muvaffaqiyatli saqlandi!' };
    }
  } catch (e) {
    console.warn('Prescription Supabase error', e);
  }

  return { ok: true, message: 'Retsept lokal saqlandi' };
}

export async function syncDebtToSupabase(debt: DebtRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('debts').upsert({
      id: debt.id,
      appointment_id: debt.appointmentId,
      pin_code: debt.pinCode,
      tenant_id: debt.tenantId || 'dentamed',
      clinic_id: debt.clinicId || 'nukus',
      patient_name: debt.patientName,
      phone: debt.phone,
      doctor_name: debt.doctorName,
      service_name: debt.serviceName,
      total_amount: debt.totalAmount,
      paid_amount: debt.paidAmount,
      debt_amount: debt.debtAmount,
      payment_status: debt.paymentStatus,
      history: debt.history || []
    });
    return !error;
  } catch (e) {
    console.warn('Debt sync error', e);
    return false;
  }
}

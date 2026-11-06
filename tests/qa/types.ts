export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';
export type FailureClassification = 'APP BUG' | 'TEST PROBLEM' | 'INFRA';

export interface TestResult {
  id: string;
  feature: 'F1' | 'F2' | 'F3' | 'F4' | 'CROSS';
  name: string;
  status: TestStatus;
  reason: string;
  durationMs: number;
  classification?: FailureClassification;
  expected?: string;
  actual?: string;
  likelyFile?: string;
  error?: string;
}

export interface SalonFixture {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  cancel_policy_hours: number;
  plan: string;
}

export interface UserFixture {
  id: string;
  salon_id: string;
  email: string;
  role: 'owner' | 'staff';
  token: string;
}

export interface StaffFixture {
  id: string;
  salon_id: string;
  name: string;
  role_title: string;
}

export interface ServiceFixture {
  id: string;
  salon_id: string;
  name: string;
  duration_min: number;
  price: number;
}

export interface CustomerFixture {
  id: string;
  salon_id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  pin: string;
  token: string;
}

export interface AppointmentFixture {
  id: string;
  salon_id: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  rescheduled_count: number;
}

export interface QADataFixtures {
  salon1: SalonFixture;
  salon2: SalonFixture;
  owner1: UserFixture;
  staff1: UserFixture;
  owner2: UserFixture;
  stylist1: StaffFixture;
  stylist2: StaffFixture;
  stylist3: StaffFixture;
  service1: ServiceFixture;
  service2: ServiceFixture;
  service3: ServiceFixture;
  customerA: CustomerFixture;
  customerB: CustomerFixture;
  customerC: CustomerFixture;
  apptFutureA: AppointmentFixture;
  apptFutureB: AppointmentFixture;
  apptNearCutoffA: AppointmentFixture;
  apptCompletedRecentA: AppointmentFixture;
  apptCompletedOldA: AppointmentFixture;
  apptCompletedRecentB: AppointmentFixture;
  apptForConcurrency: AppointmentFixture;
}


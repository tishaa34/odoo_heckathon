/**
 * Idempotent seed. Populates realistic demo data so the frontend works
 * immediately after `npm run db:seed`. Deliberately includes edge cases
 * (an expired-license driver, a suspended driver, an in-shop vehicle) so the
 * business-rule rejections can be demonstrated end-to-end.
 */
import {
  PrismaClient,
  Role,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
  ExpenseCategory,
  Prisma,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT = 12;
const DEMO_PASSWORD = 'Password123!';

const dec = (n: number) => new Prisma.Decimal(n);
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT);
  const users = [
    { name: 'Fiona Fleet', email: 'manager@transitops.com', role: Role.FLEET_MANAGER },
    { name: 'Dave Driver', email: 'driver@transitops.com', role: Role.DRIVER },
    { name: 'Sam Safety', email: 'safety@transitops.com', role: Role.SAFETY_OFFICER },
    { name: 'Fay Finance', email: 'finance@transitops.com', role: Role.FINANCIAL_ANALYST },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`✓ Seeded ${users.length} users (password for all: ${DEMO_PASSWORD})`);
}

async function seedVehicles() {
  const vehicles = [
    { registrationNumber: 'MH12AB1001', make: 'Tata', model: 'Prima 4928', year: 2021, capacityKg: 25000, odometerKm: 120000, status: VehicleStatus.AVAILABLE },
    { registrationNumber: 'MH12AB1002', make: 'Ashok Leyland', model: 'U-3718', year: 2020, capacityKg: 18000, odometerKm: 210000, status: VehicleStatus.AVAILABLE },
    { registrationNumber: 'MH12AB1003', make: 'Volvo', model: 'FMX 460', year: 2022, capacityKg: 30000, odometerKm: 85000, status: VehicleStatus.AVAILABLE },
    { registrationNumber: 'MH12AB1004', make: 'Eicher', model: 'Pro 6028', year: 2019, capacityKg: 15000, odometerKm: 300000, status: VehicleStatus.IN_SHOP },
    { registrationNumber: 'MH12AB1005', make: 'BharatBenz', model: '2823R', year: 2023, capacityKg: 22000, odometerKm: 40000, status: VehicleStatus.AVAILABLE },
    { registrationNumber: 'MH12AB1006', make: 'Mahindra', model: 'Blazo X 35', year: 2021, capacityKg: 26000, odometerKm: 150000, status: VehicleStatus.AVAILABLE },
    { registrationNumber: 'MH12AB1007', make: 'Scania', model: 'R 500', year: 2018, capacityKg: 28000, odometerKm: 420000, status: VehicleStatus.RETIRED, isRetired: true },
    { registrationNumber: 'MH12AB1008', make: 'Tata', model: 'Signa 3521', year: 2022, capacityKg: 20000, odometerKm: 60000, status: VehicleStatus.AVAILABLE },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: {},
      create: {
        registrationNumber: v.registrationNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        capacityKg: dec(v.capacityKg),
        odometerKm: dec(v.odometerKm),
        status: v.status,
        isRetired: v.isRetired ?? false,
      },
    });
  }
  console.log(`✓ Seeded ${vehicles.length} vehicles (1 in-shop, 1 retired)`);
}

async function seedDrivers() {
  const drivers = [
    { name: 'Rajesh Kumar', email: 'rajesh@transitops.com', phone: '+919812300001', licenseNumber: 'DL0120210001', licenseExpiry: daysFromNow(400), status: DriverStatus.AVAILABLE },
    { name: 'Amit Sharma', email: 'amit@transitops.com', phone: '+919812300002', licenseNumber: 'DL0120210002', licenseExpiry: daysFromNow(200), status: DriverStatus.AVAILABLE },
    { name: 'Suresh Patel', email: 'suresh@transitops.com', phone: '+919812300003', licenseNumber: 'DL0120210003', licenseExpiry: daysFromNow(90), status: DriverStatus.AVAILABLE },
    // Edge case: expired license → dispatch must be rejected.
    { name: 'Vikram Singh', email: 'vikram@transitops.com', phone: '+919812300004', licenseNumber: 'DL0120180004', licenseExpiry: daysFromNow(-30), status: DriverStatus.AVAILABLE },
    // Edge case: suspended → dispatch must be rejected.
    { name: 'Manoj Verma', email: 'manoj@transitops.com', phone: '+919812300005', licenseNumber: 'DL0120200005', licenseExpiry: daysFromNow(300), status: DriverStatus.SUSPENDED },
    { name: 'Pooja Reddy', email: 'pooja@transitops.com', phone: '+919812300006', licenseNumber: 'DL0120220006', licenseExpiry: daysFromNow(500), status: DriverStatus.OFF_DUTY },
  ];
  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: { ...d, licenseExpiry: d.licenseExpiry },
    });
  }
  console.log(`✓ Seeded ${drivers.length} drivers (1 expired license, 1 suspended, 1 off-duty)`);
}

async function seedOperations() {
  // Avoid duplicating operational data on re-run.
  if ((await prisma.trip.count()) > 0) {
    console.log('✓ Operational data already present — skipping trips/maintenance/fuel/expenses');
    return;
  }

  const manager = await prisma.user.findUniqueOrThrow({ where: { email: 'manager@transitops.com' } });
  const v = await prisma.vehicle.findMany({ orderBy: { registrationNumber: 'asc' } });
  const d = await prisma.driver.findMany({ orderBy: { licenseNumber: 'asc' } });

  // A completed trip (with revenue + distance) to make analytics meaningful.
  const completed = await prisma.trip.create({
    data: {
      vehicleId: v[0].id,
      driverId: d[0].id,
      origin: 'Mumbai',
      destination: 'Pune',
      cargoWeightKg: dec(18000),
      distanceKm: dec(150),
      revenue: dec(45000),
      status: TripStatus.COMPLETED,
      startedAt: daysFromNow(-3),
      completedAt: daysFromNow(-2),
      createdById: manager.id,
      history: {
        create: [
          { toStatus: TripStatus.DISPATCHED, changedById: manager.id, reason: 'Trip created & dispatched' },
          { fromStatus: TripStatus.DISPATCHED, toStatus: TripStatus.IN_PROGRESS, changedById: manager.id, reason: 'Started' },
          { fromStatus: TripStatus.IN_PROGRESS, toStatus: TripStatus.COMPLETED, changedById: manager.id, reason: 'Completed' },
        ],
      },
    },
  });

  // A live dispatched trip — vehicle & driver are reserved (On Trip), demonstrating
  // that both are hidden from the trip-creation pool until this trip completes.
  await prisma.trip.create({
    data: {
      vehicleId: v[1].id,
      driverId: d[1].id,
      origin: 'Delhi',
      destination: 'Jaipur',
      cargoWeightKg: dec(12000),
      distanceKm: dec(280),
      revenue: dec(60000),
      status: TripStatus.DISPATCHED,
      createdById: manager.id,
      history: { create: [{ toStatus: TripStatus.DISPATCHED, changedById: manager.id, reason: 'Trip created & dispatched' }] },
    },
  });
  await prisma.vehicle.update({ where: { id: v[1].id }, data: { status: VehicleStatus.ON_TRIP } });
  await prisma.driver.update({ where: { id: d[1].id }, data: { status: DriverStatus.ON_TRIP } });

  // Maintenance: one closed (history) + one open on the in-shop vehicle.
  const inShop = v.find((x) => x.status === VehicleStatus.IN_SHOP)!;
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: v[0].id, type: 'Oil Change', description: 'Routine service', cost: dec(4500), status: MaintenanceStatus.CLOSED, closedAt: daysFromNow(-10) },
      { vehicleId: inShop.id, type: 'Brake Repair', description: 'Front brake pad replacement', cost: dec(12000), status: MaintenanceStatus.OPEN },
    ],
  });

  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: v[0].id, tripId: completed.id, liters: dec(120), cost: dec(11400), odometerKm: dec(120000) },
      { vehicleId: v[0].id, liters: dec(90), cost: dec(8550), odometerKm: dec(120450) },
      { vehicleId: v[1].id, liters: dec(150), cost: dec(14250), odometerKm: dec(210300) },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { vehicleId: v[0].id, tripId: completed.id, category: ExpenseCategory.TOLL, amount: dec(1200), note: 'Mumbai-Pune expressway toll' },
      { vehicleId: v[0].id, category: ExpenseCategory.MISC, amount: dec(800), note: 'Driver allowance' },
      { vehicleId: inShop.id, category: ExpenseCategory.MAINTENANCE, amount: dec(12000), note: 'Brake repair parts' },
    ],
  });

  console.log('✓ Seeded trips, maintenance, fuel logs and expenses');
}

async function main() {
  console.log('🌱 Seeding TransitOps database...');
  await seedUsers();
  await seedVehicles();
  await seedDrivers();
  await seedOperations();
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

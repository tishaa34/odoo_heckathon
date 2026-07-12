import { DriverStatus, ExpenseCategory, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

/** Small helpers to keep aggregation reads terse. */
const toNum = (d: { toNumber(): number } | null | undefined) => (d ? d.toNumber() : 0);

function groupToMap<T extends string>(rows: { [k: string]: unknown; _count: { _all: number } }[], key: string) {
  const map = {} as Record<T, number>;
  for (const row of rows) map[row[key] as T] = row._count._all;
  return map;
}

export const analyticsService = {
  /** Top-level operational dashboard — every metric derived live from the DB. */
  async dashboard() {
    const [vehicleGroups, driverGroups, tripGroups, fuelAgg, maintenanceAgg, expenseAgg, revenueAgg] =
      await Promise.all([
        prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.driver.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.trip.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
        prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.trip.aggregate({ _sum: { revenue: true }, where: { status: TripStatus.COMPLETED } }),
      ]);

    const vehicles = groupToMap<VehicleStatus>(vehicleGroups, 'status');
    const drivers = groupToMap<DriverStatus>(driverGroups, 'status');
    const trips = groupToMap<TripStatus>(tripGroups, 'status');

    const totalVehicles = Object.values(vehicles).reduce((a, b) => a + b, 0);
    const activeVehicles = totalVehicles - (vehicles.RETIRED ?? 0);
    const onTrip = vehicles.ON_TRIP ?? 0;
    const fleetUtilization = activeVehicles > 0 ? +((onTrip / activeVehicles) * 100).toFixed(2) : 0;

    const fuelCost = toNum(fuelAgg._sum.cost);
    const maintenanceCost = toNum(maintenanceAgg._sum.cost);
    const otherExpenses = toNum(expenseAgg._sum.amount);
    const totalOperationalCost = +(fuelCost + maintenanceCost + otherExpenses).toFixed(2);
    const totalRevenue = toNum(revenueAgg._sum.revenue);

    return {
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
        available: vehicles.AVAILABLE ?? 0,
        onTrip,
        inShop: vehicles.IN_SHOP ?? 0,
        retired: vehicles.RETIRED ?? 0,
      },
      drivers: {
        total: Object.values(drivers).reduce((a, b) => a + b, 0),
        available: drivers.AVAILABLE ?? 0,
        onDuty: (drivers.AVAILABLE ?? 0) + (drivers.ON_TRIP ?? 0),
        onTrip: drivers.ON_TRIP ?? 0,
        offDuty: drivers.OFF_DUTY ?? 0,
        suspended: drivers.SUSPENDED ?? 0,
      },
      trips: {
        total: Object.values(trips).reduce((a, b) => a + b, 0),
        pending: trips.PENDING ?? 0,
        active: (trips.DISPATCHED ?? 0) + (trips.IN_PROGRESS ?? 0),
        completed: trips.COMPLETED ?? 0,
        cancelled: trips.CANCELLED ?? 0,
      },
      financials: {
        fuelCost: +fuelCost.toFixed(2),
        maintenanceCost: +maintenanceCost.toFixed(2),
        otherExpenses: +otherExpenses.toFixed(2),
        totalOperationalCost,
        totalRevenue: +totalRevenue.toFixed(2),
        netProfit: +(totalRevenue - totalOperationalCost).toFixed(2),
      },
      fleetUtilization,
    };
  },

  /** Per-vehicle utilization: share of active fleet currently on a trip + counts. */
  async fleetUtilization() {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: VehicleStatus.RETIRED } },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        _count: { select: { trips: { where: { status: TripStatus.COMPLETED } } } },
      },
    });
    const total = vehicles.length;
    const onTrip = vehicles.filter((v) => v.status === VehicleStatus.ON_TRIP).length;
    return {
      totalActiveVehicles: total,
      vehiclesOnTrip: onTrip,
      utilizationPercent: total > 0 ? +((onTrip / total) * 100).toFixed(2) : 0,
      perVehicle: vehicles.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        status: v.status,
        completedTrips: v._count.trips,
      })),
    };
  },

  /**
   * Vehicle ROI = (revenue from completed trips − operating cost) / operating cost.
   * Operating cost = fuel + maintenance + other expenses tied to the vehicle.
   */
  async vehicleRoi(vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw ApiError.notFound('Vehicle not found.');

    const [fuel, maintenance, expenses, revenue, fuelLiters, completedTrips] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.expense.aggregate({
        where: { vehicleId, category: { not: ExpenseCategory.FUEL } },
        _sum: { amount: true },
      }),
      prisma.trip.aggregate({
        where: { vehicleId, status: TripStatus.COMPLETED },
        _sum: { revenue: true, distanceKm: true },
      }),
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { liters: true } }),
      prisma.trip.count({ where: { vehicleId, status: TripStatus.COMPLETED } }),
    ]);

    const fuelCost = toNum(fuel._sum.cost);
    const maintenanceCost = toNum(maintenance._sum.cost);
    const otherExpenses = toNum(expenses._sum.amount);
    const operatingCost = +(fuelCost + maintenanceCost + otherExpenses).toFixed(2);
    const totalRevenue = toNum(revenue._sum.revenue);
    const totalDistance = toNum(revenue._sum.distanceKm);
    const liters = toNum(fuelLiters._sum.liters);
    const acquisitionCost = toNum(vehicle.acquisitionCost);
    const netProfit = +(totalRevenue - operatingCost).toFixed(2);

    return {
      vehicleId,
      registrationNumber: vehicle.registrationNumber,
      completedTrips,
      totalRevenue: +totalRevenue.toFixed(2),
      acquisitionCost,
      costBreakdown: { fuelCost, maintenanceCost, otherExpenses },
      operatingCost,
      netProfit,
      // ROI = net profit earned by the vehicle ÷ its acquisition cost.
      roiPercent: acquisitionCost > 0 ? +((netProfit / acquisitionCost) * 100).toFixed(2) : null,
      fuelEfficiencyKmPerLitre: liters > 0 ? +(totalDistance / liters).toFixed(2) : null,
    };
  },

  /** Company-wide cost summary broken down by source. */
  async costs() {
    const [fuel, maintenance, byCategory] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
      prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } }),
    ]);
    const fuelCost = toNum(fuel._sum.cost);
    const maintenanceCost = toNum(maintenance._sum.cost);
    const expenseByCategory = byCategory.map((row) => ({
      category: row.category,
      amount: toNum(row._sum.amount),
    }));
    const otherExpenses = expenseByCategory.reduce((a, b) => a + b.amount, 0);
    return {
      fuelCost: +fuelCost.toFixed(2),
      fuelLiters: toNum(fuel._sum.liters),
      maintenanceCost: +maintenanceCost.toFixed(2),
      expenseByCategory,
      totalOperationalCost: +(fuelCost + maintenanceCost + otherExpenses).toFixed(2),
    };
  },

  /** Driver utilization and workload leaderboard. */
  async drivers() {
    const [statusGroups, topDrivers] = await Promise.all([
      prisma.driver.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.driver.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          _count: { select: { trips: { where: { status: TripStatus.COMPLETED } } } },
        },
        orderBy: { trips: { _count: 'desc' } },
        take: 10,
      }),
    ]);
    const statuses = groupToMap<DriverStatus>(statusGroups, 'status');
    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
    const onDuty = (statuses.AVAILABLE ?? 0) + (statuses.ON_TRIP ?? 0);
    return {
      total,
      onDuty,
      driverUtilizationPercent: total > 0 ? +(((statuses.ON_TRIP ?? 0) / total) * 100).toFixed(2) : 0,
      byStatus: statuses,
      topDrivers: topDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        completedTrips: d._count.trips,
      })),
    };
  },
};

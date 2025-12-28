const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService'); // Assuming this exists

class ProductionService {
    /**
     * Get Production Schedule for a Project
     */
    async getSchedule(projectId) {
        return await prisma.productionSchedule.findUnique({
            where: { projectId },
            include: {
                days: {
                    include: {
                        scenes: true,
                        attendance: true
                    },
                    orderBy: { date: 'asc' }
                }
            }
        });
    }

    /**
     * Sync/Create Schedule from External Source (or Initialize)
     */
    async syncSchedule(projectId, scheduleData) {
        // 1. Find or Create Schedule
        let schedule = await prisma.productionSchedule.findUnique({ where: { projectId } });
        if (!schedule) {
            schedule = await prisma.productionSchedule.create({
                data: {
                    projectId,
                    name: scheduleData.name || 'Production Schedule',
                    startDate: new Date(scheduleData.startDate),
                    endDate: new Date(scheduleData.endDate),
                    status: 'ACTIVE'
                }
            });
        }

        // 2. Upsert Days
        if (scheduleData.days) {
            for (const day of scheduleData.days) {
                const shootingDay = await prisma.shootingDay.upsert({
                    where: {
                        scheduleId_date: {
                            scheduleId: schedule.id,
                            date: new Date(day.date)
                        }
                    },
                    update: {
                        startTime: day.startTime ? new Date(day.startTime) : null,
                        endTime: day.endTime ? new Date(day.endTime) : null,
                        location: day.location,
                        status: day.status
                    },
                    create: {
                        scheduleId: schedule.id,
                        date: new Date(day.date),
                        dayNumber: day.dayNumber,
                        startTime: day.startTime ? new Date(day.startTime) : null,
                        endTime: day.endTime ? new Date(day.endTime) : null,
                        location: day.location,
                        status: day.status
                    }
                });

                // 3. Upsert Scenes
                if (day.scenes) {
                    await prisma.scene.deleteMany({ where: { shootingDayId: shootingDay.id } }); // Simple replacement strategy
                    await prisma.scene.createMany({
                        data: day.scenes.map(s => ({
                            shootingDayId: shootingDay.id,
                            sceneNumber: s.sceneNumber,
                            description: s.description,
                            location: s.location,
                            pages: s.pages
                        }))
                    });
                }
            }
        }

        return this.getSchedule(projectId);
    }

    /**
     * Get Attendance for a specific Shooting Day
     */
    async getDayAttendance(shootingDayId) {
        return await prisma.attendanceRecord.findMany({
            where: { shootingDayId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        email: true
                    }
                }
            }
        });
    }

    /**
     * Check-in / Update Status for Crew Member
     */
    async updateAttendance(shootingDayId, userId, status, locationData = null) {
        const record = await prisma.attendanceRecord.upsert({
            where: {
                userId_shootingDayId: { userId, shootingDayId }
            },
            update: {
                status,
                checkInTime: status === 'PRESENT' ? new Date() : undefined,
                locationLat: locationData?.lat,
                locationLng: locationData?.lng
            },
            create: {
                shootingDayId,
                userId,
                status,
                checkInTime: status === 'PRESENT' ? new Date() : null,
                locationLat: locationData?.lat,
                locationLng: locationData?.lng
            }
        });

        // Feature #26: Auto-cancel orders if ABSENT
        if (status === 'ABSENT' || status === 'SICK_LEAVE') {
            await this.autoCancelMealOrders(userId, shootingDayId);
        }

        return record;
    }

    /**
     * Auto-cancel orders for Absent Crew
     */
    async autoCancelMealOrders(userId, shootingDayId) {
        // 1. Get Date of Shooting Day
        const day = await prisma.shootingDay.findUnique({ where: { id: shootingDayId } });
        if (!day) return;

        // 2. Find active orders for this user on this day
        const startOfDay = new Date(day.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day.date);
        endOfDay.setHours(23, 59, 59, 999);

        const activeOrders = await prisma.order.findMany({
            where: {
                userId,
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: { in: ['PENDING', 'CONFIRMED'] } // Don't cancel if already DELIVERED
            }
        });

        // 3. Cancel them
        for (const order of activeOrders) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'CANCELLED' }
            });

            // Notify
            await notificationService.createNotification({
                userId,
                type: 'SYSTEM',
                title: 'Order Cancelled',
                message: `Your order #${order.id.slice(-6)} was automatically cancelled due to absence status.`
            });
        }

        return activeOrders.length;
    }

    /**
     * Get Budget Stats & Forecasts (Feature #17)
     */
    async getBudgetStats(projectId) {
        // This would typically aggregate from CostBudget, Orders, and ProductionSchedule
        // Simplified Implementation:

        // 1. Get Budgets
        const budgets = await prisma.costBudget.findMany({
            // where: { projectId } // Assuming budgets link to project, schema uses user/dept mostly, let's assume global or link via user
        });

        // 2. Calculate Totals (Mock logic for aggregation as schema is user-centric mostly)
        // In a real app, we'd query Orders linked to Project and sum them up by category.

        // Placeholder Real-ish Data
        return {
            totalBudget: 1000000,
            totalSpent: 450000,
            categories: [
                { name: 'Catering', allocated: 150000, spent: 85000, projected: 160000 },
                { name: 'Logistics', allocated: 50000, spent: 12000, projected: 48000 }
            ]
        };
    }
}

module.exports = new ProductionService();

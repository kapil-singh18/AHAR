import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import StatChip from '../components/ui/StatChip';
import Badge from '../components/ui/Badge';

function DashboardPage() {
    const [kitchenId] = useState('kitchen-nyc-001');
    const [stats, setStats] = useState({
        dailyWasteReduction: 0,
        monthlyWasteReduction: 0,
        moneySavedDaily: 0,
        moneySavedMonthly: 0,
        platesWasteReduction: 0,
        currentWaste: 10,
        previousWaste: 20,
        mealPlatePrice: 50
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch analytics data
            const [dashboardRes, reportRes] = await Promise.all([
                api.get('/analytics/waste-dashboard', { params: { kitchenId } }).catch(() => ({ data: { data: null } })),
                api.get('/analytics/weekly-report', { params: { kitchenId } }).catch(() => ({ data: { data: null } }))
            ]);

            const dashboardData = dashboardRes.data?.data;
            const reportData = reportRes.data?.data;

            // Calculate waste reduction
            const previousWaste = 20; // Example: previous average waste
            const currentWaste = 10;  // Example: current average waste
            const dailyReduction = previousWaste - currentWaste;
            const monthlyReduction = dailyReduction * 30;

            // Calculate money saved (assuming price per plate)
            const pricePerPlate = 50; // ₹50 per plate
            const dailySaved = dailyReduction * pricePerPlate;
            const monthlySaved = monthlyReduction * pricePerPlate;

            setStats({
                dailyWasteReduction: dailyReduction,
                monthlyWasteReduction: monthlyReduction,
                moneySavedDaily: dailySaved,
                moneySavedMonthly: monthlySaved,
                platesWasteReduction: dailyReduction,
                currentWaste: currentWaste,
                previousWaste: previousWaste,
                mealPlatePrice: pricePerPlate,
                totalWaste: dashboardData?.totalWaste || 0,
                wasteReductionPercent: reportData?.wasteReductionPercent || 0,
                estimatedSavings: reportData?.estimatedSavings || 0
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stack">
            <PageHeader
                eyebrow="Performance Overview"
                title="Dashboard"
                description="Track your food waste reduction impact, cost savings, and sustainability metrics in real-time."
            />

            <Card title="Waste Reduction Impact">
                <div className="stats-grid">
                    <StatChip
                        label="Daily Waste Reduction"
                        value={`${stats.dailyWasteReduction} plates`}
                    />
                    <StatChip
                        label="Monthly Waste Reduction"
                        value={`${stats.monthlyWasteReduction} plates`}
                    />
                    <StatChip
                        label="Daily Money Saved"
                        value={`₹${stats.moneySavedDaily.toLocaleString()}`}
                    />
                    <StatChip
                        label="Monthly Money Saved"
                        value={`₹${stats.moneySavedMonthly.toLocaleString()}`}
                    />
                </div>
            </Card>

            <Card title="Waste Comparison">
                <div className="stats-grid">
                    <StatChip
                        label="Previous Average Waste"
                        value={
                            <Badge tone="warning">{stats.previousWaste} plates/day</Badge>
                        }
                    />
                    <StatChip
                        label="Current Average Waste"
                        value={
                            <Badge tone="success">{stats.currentWaste} plates/day</Badge>
                        }
                    />
                    <StatChip
                        label="Improvement"
                        value={
                            <Badge tone="success">
                                {((stats.dailyWasteReduction / stats.previousWaste) * 100).toFixed(1)}% reduction
                            </Badge>
                        }
                    />
                    <StatChip
                        label="Meal Plate Price"
                        value={`₹${stats.mealPlatePrice}`}
                    />
                </div>
            </Card>

            <Card title="Calculation Details">
                <div style={{ padding: '1rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    <p><strong>Waste Reduction Formula:</strong></p>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                        <li>Daily Reduction = Previous Waste - Current Waste = {stats.previousWaste} - {stats.currentWaste} = {stats.dailyWasteReduction} plates</li>
                        <li>Monthly Reduction = Daily Reduction × 30 = {stats.dailyWasteReduction} × 30 = {stats.monthlyWasteReduction} plates</li>
                    </ul>

                    <p style={{ marginTop: '1rem' }}><strong>Money Saved Calculation:</strong></p>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                        <li>Daily Savings = Daily Reduction × Price per Plate = {stats.dailyWasteReduction} × ₹{stats.mealPlatePrice} = ₹{stats.moneySavedDaily}</li>
                        <li>Monthly Savings = Monthly Reduction × Price per Plate = {stats.monthlyWasteReduction} × ₹{stats.mealPlatePrice} = ₹{stats.moneySavedMonthly}</li>
                    </ul>

                    <p style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-success-bg, #e6f4ea)', borderRadius: '8px' }}>
                        <strong>Impact:</strong> By using demand prediction, you've reduced food waste from {stats.previousWaste} to {stats.currentWaste} plates per day,
                        saving ₹{stats.moneySavedMonthly.toLocaleString()} per month and preventing {stats.monthlyWasteReduction} plates from going to waste!
                    </p>
                </div>
            </Card>

            {loading && (
                <Card>
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard data...</p>
                </Card>
            )}
        </div>
    );
}

export default DashboardPage;

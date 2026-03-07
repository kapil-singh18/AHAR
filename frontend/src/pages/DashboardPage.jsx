import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import StatChip from '../components/ui/StatChip';
import Badge from '../components/ui/Badge';

function toShortDate(dateLabel) {
    const d = new Date(dateLabel);
    if (Number.isNaN(d.getTime())) return String(dateLabel);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getLinePath(values, width = 560, height = 200, padding = 20) {
    const max = Math.max(...values, 1);
    const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    return values
        .map((value, idx) => {
            const x = padding + idx * stepX;
            const y = height - padding - ((value / max) * (height - padding * 2));
            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
}

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
        mealPlatePrice: 50,
        totalWaste: 0,
        wasteReductionPercent: 0,
        estimatedSavings: 0
    });
    const [dailyWasteSeries, setDailyWasteSeries] = useState([]);
    const [dishWasteSeries, setDishWasteSeries] = useState([]);
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
            const dailyWasteTotals = dashboardData?.dailyWasteTotals || [];
            const dishWiseWaste = dashboardData?.dishWiseWaste || [];

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

            const seriesFromApi = dailyWasteTotals
                .slice(-7)
                .map((item) => ({
                    label: toShortDate(item?._id?.date),
                    value: Number(item?.totalLeftover || 0)
                }));

            const fallbackSeries = [
                { label: 'Mon', value: 21 },
                { label: 'Tue', value: 19 },
                { label: 'Wed', value: 17 },
                { label: 'Thu', value: 15 },
                { label: 'Fri', value: 13 },
                { label: 'Sat', value: 11 },
                { label: 'Sun', value: 10 }
            ];

            setDailyWasteSeries(seriesFromApi.length > 0 ? seriesFromApi : fallbackSeries);

            const topDishes = dishWiseWaste
                .slice(0, 5)
                .map((item) => ({
                    label: item?.dishName || 'Unknown dish',
                    value: Number(item?.totalLeftover || 0)
                }));

            const fallbackDishes = [
                { label: 'Rice Bowl', value: 38 },
                { label: 'Dal Curry', value: 29 },
                { label: 'Paneer Dish', value: 23 },
                { label: 'Roti', value: 19 },
                { label: 'Salad', value: 15 }
            ];

            setDishWasteSeries(topDishes.length > 0 ? topDishes : fallbackDishes);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const improvementPercent = Number(((stats.dailyWasteReduction / stats.previousWaste) * 100).toFixed(1));
    const ringPercent = Math.max(0, Math.min(100, improvementPercent));

    const lineValues = dailyWasteSeries.map((item) => item.value);
    const linePath = lineValues.length ? getLinePath(lineValues) : '';
    const lineMax = Math.max(...lineValues, 1);
    const barsMax = Math.max(...dishWasteSeries.map((item) => item.value), 1);

    return (
        <div className="stack">
            <PageHeader
                eyebrow="Performance Overview"
                title="Dashboard"
                description="Track your food waste reduction impact, cost savings, and sustainability metrics in real-time."
            />

            <div className="dashboard-visual-grid">
                <Card title="7-Day Waste Trend">
                    <div className="chart-wrap">
                        <svg className="line-chart" viewBox="0 0 560 200" role="img" aria-label="Daily waste trend line chart">
                            <line x1="20" y1="180" x2="540" y2="180" className="chart-axis" />
                            <line x1="20" y1="20" x2="20" y2="180" className="chart-axis" />
                            {linePath && <path d={linePath} className="chart-line" />}
                            {dailyWasteSeries.map((point, index) => {
                                const x = 20 + (dailyWasteSeries.length > 1 ? index * (520 / (dailyWasteSeries.length - 1)) : 0);
                                const y = 180 - ((point.value / lineMax) * 160);
                                return (
                                    <g key={`${point.label}-${index}`}>
                                        <circle cx={x} cy={y} r="4" className="chart-point" />
                                        <text x={x} y="196" textAnchor="middle" className="chart-label">{point.label}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <p className="chart-caption">Lower line means less leftover food. Goal is steady downward trend.</p>
                </Card>

                <Card title="Waste Reduction Progress">
                    <div className="progress-ring-wrap">
                        <div
                            className="progress-ring"
                            style={{ background: `conic-gradient(var(--success) ${ringPercent}%, color-mix(in srgb, var(--surface-muted) 92%, transparent) 0)` }}
                        >
                            <div className="progress-ring-inner">
                                <strong>{ringPercent}%</strong>
                                <span>Improvement</span>
                            </div>
                        </div>
                    </div>
                    <div className="progress-legend">
                        <p>Old waste: <strong>{stats.previousWaste} plates/day</strong></p>
                        <p>Now waste: <strong>{stats.currentWaste} plates/day</strong></p>
                    </div>
                </Card>
            </div>

            <Card title="Top Dish-Wise Waste (Plates)">
                <div className="bar-chart">
                    {dishWasteSeries.map((item, idx) => (
                        <div className="bar-item" key={`${item.label}-${idx}`}>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{ height: `${Math.max(8, (item.value / barsMax) * 100)}%` }}
                                />
                            </div>
                            <p className="bar-value">{item.value}</p>
                            <p className="bar-label" title={item.label}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </Card>

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
                                {improvementPercent}% reduction
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

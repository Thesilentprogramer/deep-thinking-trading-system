import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Loader, TrendingUp, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const INDICATOR_COLORS = {
    sma20: '#fbbf24',      // yellow
    sma50: '#60a5fa',      // blue
    bollUpper: 'rgba(255,255,255,0.18)',
    bollLower: 'rgba(255,255,255,0.18)',
    rsiLine: '#c084fc',    // purple
    rsi30: 'rgba(74,222,128,0.3)',
    rsi70: 'rgba(248,113,113,0.3)',
};

function PriceChart({ ticker }) {
    const chartContainerRef = useRef(null);
    const rsiContainerRef = useRef(null);
    const chartRef = useRef(null);
    const rsiChartRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [timeframe, setTimeframe] = useState('6mo'); // 1mo, 3mo, 6mo, 1y
    const [indicators, setIndicators] = useState({
        sma20: true, sma50: true, bollinger: true,
    });

    useEffect(() => {
        if (!ticker) return;
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/chart-data/${ticker}?period=${timeframe}`);
                if (!res.ok) throw new Error('Failed to load chart data');
                const data = await res.json();
                if (cancelled) return;
                setChartData(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; cleanup(); };
    }, [ticker, timeframe]);

    useEffect(() => {
        if (!loading && chartData && chartContainerRef.current && rsiContainerRef.current) {
            try {
                renderChart(chartData);
            } catch (err) {
                console.error("Error rendering chart:", err);
                setError(err.message);
            }
        }
        return () => cleanup();
    }, [chartData, loading]);

    // Re-render when indicator toggles change
    useEffect(() => {
        if (chartRef.current && chartRef.current._seriesData) {
            updateIndicatorVisibility();
        }
    }, [indicators]);

    const cleanup = () => {
        if (chartRef.current) {
            if (chartRef.current._observer) {
                chartRef.current._observer.disconnect();
            }
            chartRef.current.remove();
            chartRef.current = null;
        }
        if (rsiChartRef.current) {
            rsiChartRef.current.remove();
            rsiChartRef.current = null;
        }
    };

    const renderChart = (data) => {
        cleanup();
        if (!chartContainerRef.current || !rsiContainerRef.current) return;

        // ── Main chart ──
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 380,
            layout: {
                background: { color: '#0a0a0a' },
                textColor: 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.04)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            crosshair: {
                mode: 0,
                vertLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' },
                horzLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.05, bottom: 0.15 },
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                timeVisible: false,
            },
            handleScroll: true,
            handleScale: true,
        });
        chartRef.current = chart;

        // Candlestick series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#4ade80',
            downColor: '#f87171',
            borderUpColor: '#4ade80',
            borderDownColor: '#f87171',
            wickUpColor: '#4ade80',
            wickDownColor: '#f87171',
        });
        candleSeries.setData(data.candles);

        // Volume histogram
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeries.setData(data.volume);

        // SMA20
        const sma20Series = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS.sma20,
            lineWidth: 1,
            title: 'SMA 20',
            visible: indicators.sma20,
        });
        sma20Series.setData(data.sma20 || []);

        // SMA50
        const sma50Series = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS.sma50,
            lineWidth: 1,
            title: 'SMA 50',
            visible: indicators.sma50,
        });
        sma50Series.setData(data.sma50 || []);

        // Bollinger Bands
        const bollUpperSeries = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS.bollUpper,
            lineWidth: 1,
            lineStyle: 2, // dashed
            title: 'BB Upper',
            visible: indicators.bollinger,
        });
        bollUpperSeries.setData(data.boll_upper || []);

        const bollLowerSeries = chart.addSeries(LineSeries, {
            color: INDICATOR_COLORS.bollLower,
            lineWidth: 1,
            lineStyle: 2,
            title: 'BB Lower',
            visible: indicators.bollinger,
        });
        bollLowerSeries.setData(data.boll_lower || []);

        // Store references for toggling
        chart._seriesData = { sma20Series, sma50Series, bollUpperSeries, bollLowerSeries };

        // ── RSI chart ──
        const rsiChart = createChart(rsiContainerRef.current, {
            width: rsiContainerRef.current.clientWidth,
            height: 120,
            layout: {
                background: { color: '#0a0a0a' },
                textColor: 'rgba(255,255,255,0.4)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.04)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                timeVisible: false,
                visible: true,
            },
            crosshair: {
                vertLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' },
                horzLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' },
            },
            handleScroll: true,
            handleScale: true,
        });
        rsiChartRef.current = rsiChart;

        const rsiSeries = rsiChart.addSeries(LineSeries, {
            color: INDICATOR_COLORS.rsiLine,
            lineWidth: 1.5,
            title: 'RSI 14',
        });
        rsiSeries.setData(data.rsi || []);

        // RSI reference lines (70 / 30)
        if (data.rsi && data.rsi.length > 1) {
            const first = data.rsi[0].time;
            const last = data.rsi[data.rsi.length - 1].time;
            const rsi70Series = rsiChart.addSeries(LineSeries, {
                color: INDICATOR_COLORS.rsi70,
                lineWidth: 1,
                lineStyle: 2,
            });
            rsi70Series.setData([{ time: first, value: 70 }, { time: last, value: 70 }]);

            const rsi30Series = rsiChart.addSeries(LineSeries, {
                color: INDICATOR_COLORS.rsi30,
                lineWidth: 1,
                lineStyle: 2,
            });
            rsi30Series.setData([{ time: first, value: 30 }, { time: last, value: 30 }]);
        }

        // Sync time scales
        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range) rsiChart.timeScale().setVisibleLogicalRange(range);
        });
        rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range) chart.timeScale().setVisibleLogicalRange(range);
        });

        // Resize observer
        const observer = new ResizeObserver(() => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
            if (rsiContainerRef.current) {
                rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
            }
        });
        if (chartContainerRef.current) observer.observe(chartContainerRef.current);

        chart.timeScale().fitContent();
        rsiChart.timeScale().fitContent();

        // Save observer to ref so we can disconnect it on cleanup
        chartRef.current._observer = observer;
    };

    const updateIndicatorVisibility = () => {
        const s = chartRef.current?._seriesData;
        if (!s) return;
        s.sma20Series.applyOptions({ visible: indicators.sma20 });
        s.sma50Series.applyOptions({ visible: indicators.sma50 });
        s.bollUpperSeries.applyOptions({ visible: indicators.bollinger });
        s.bollLowerSeries.applyOptions({ visible: indicators.bollinger });
    };

    const toggleIndicator = (key) => {
        setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="chart-container chart-loading">
                <Loader size={16} className="animate-pulse" style={{ opacity: 0.4 }} />
                <span>Loading chart data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chart-container chart-error">
                <TrendingUp size={16} style={{ opacity: 0.3 }} />
                <span>Chart unavailable: {error}</span>
            </div>
        );
    }

    return (
        <div className="chart-wrapper">
            <div className="chart-header">
                <div className="chart-title">
                    <BarChart3 size={14} />
                    <span>Price Chart — {ticker}</span>
                </div>
                <div className="chart-toggles">
                    <div className="chart-timeframes" style={{ display: 'flex', gap: '4px', marginRight: '16px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '16px' }}>
                        {[
                            { value: '1mo', label: '1M' },
                            { value: '3mo', label: '3M' },
                            { value: '6mo', label: '6M' },
                            { value: '1y', label: '1Y' },
                        ].map(({ value, label }) => (
                            <button
                                key={value}
                                className={`chart-toggle ${timeframe === value ? 'chart-toggle-active' : ''}`}
                                onClick={() => setTimeframe(value)}
                                style={{ padding: '0.2rem 0.6rem' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {[
                        { key: 'sma20', label: 'SMA 20', color: INDICATOR_COLORS.sma20 },
                        { key: 'sma50', label: 'SMA 50', color: INDICATOR_COLORS.sma50 },
                        { key: 'bollinger', label: 'Bollinger', color: '#fff' },
                    ].map(({ key, label, color }) => (
                        <button
                            key={key}
                            className={`chart-toggle ${indicators[key] ? 'chart-toggle-active' : ''}`}
                            onClick={() => toggleIndicator(key)}
                        >
                            <span className="chart-toggle-dot" style={{ background: indicators[key] ? color : 'rgba(255,255,255,0.15)' }} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={chartContainerRef} className="chart-canvas" />
            <div className="chart-rsi-label">RSI (14)</div>
            <div ref={rsiContainerRef} className="chart-canvas chart-rsi" />
        </div>
    );
}

export default PriceChart;

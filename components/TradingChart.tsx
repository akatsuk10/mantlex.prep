"use client";

import { createChart, ColorType, IChartApi, LineSeries, Time, LineStyle, MouseEventParams } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface TradingChartProps {
    data: {
        time: Time;
        open: number;
        high: number;
        low: number;
        close: number;
    }[];
}

export const TradingChart = ({ data }: TradingChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const isDark = resolvedTheme === 'dark';
        const lineColor = isDark ? '#ffffff' : '#151515';
        const textColor = isDark ? '#9ca3af' : '#6b7280';
        const crosshairColor = isDark ? '#4b5563' : '#e5e7eb';
        const markerBorderColor = isDark ? '#000000' : '#ffffff';
        const markerBackgroundColor = isDark ? '#ffffff' : '#000000';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: textColor,
                fontFamily: "var(--font-geist-mono), monospace",
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            rightPriceScale: {
                borderVisible: false,
                visible: false,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: {
                    labelVisible: false,
                    style: LineStyle.Solid,
                    color: crosshairColor,
                },
                horzLine: {
                    labelVisible: false,
                    visible: false,
                },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            handleScale: {
                mouseWheel: false,
            },
            handleScroll: {
                mouseWheel: false,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            }
        });

        const newSeries = chart.addSeries(LineSeries, {
            lineType: 1,
            color: lineColor,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            crosshairMarkerBorderColor: markerBorderColor,
            crosshairMarkerBackgroundColor: markerBackgroundColor,
            priceLineVisible: false,
            lastValueVisible: true,
        });

        const lineData = data.map(d => ({
            time: d.time,
            value: d.close
        }));

        newSeries.setData(lineData);
        chart.timeScale().fitContent();

        const toolTip = tooltipRef.current;
        if (toolTip) {
            chart.subscribeCrosshairMove((param: MouseEventParams) => {
                if (
                    param.point === undefined ||
                    !param.time ||
                    param.point.x < 0 ||
                    param.point.x > chartContainerRef.current!.clientWidth ||
                    param.point.y < 0 ||
                    param.point.y > chartContainerRef.current!.clientHeight
                ) {
                    toolTip.style.display = 'none';
                    return;
                }

                toolTip.style.display = 'block';
                const data = param.seriesData.get(newSeries);
                const price = (data as any)?.value || (data as any)?.close;

                if (price !== undefined) {
                    const dateStr = new Date(Number(param.time) * 1000).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });

                    toolTip.innerHTML = `
                        <div class="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">${dateStr}</div>
                        <div class="text-sm font-mono font-bold text-foreground">$${Number(price).toFixed(6)}</div>
                    `;

                    const coordinate = newSeries.priceToCoordinate(price);
                    let shiftedX = param.point.x - 60;
                    let shiftedY = (coordinate ?? param.point.y) - 60;

                    if (shiftedX < 0) shiftedX = 5;
                    if (shiftedY < 0) shiftedY = 5;

                    toolTip.style.left = shiftedX + 'px';
                    toolTip.style.top = shiftedY + 'px';
                }
            });
        }

        chartRef.current = chart;
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, resolvedTheme]);

    return (
        <div className="relative w-full h-[350px]">
            <div ref={chartContainerRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                className="absolute hidden pointer-events-none bg-background border border-border/50 rounded-lg p-3 shadow-lg z-10 transition-opacity duration-100"
                style={{
                    width: '140px',
                    height: 'auto',
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    );
};

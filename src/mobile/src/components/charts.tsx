import * as React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";

import { Text } from "@/components/ui/text";

export function compactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000)}K`;
  return `${Math.round(value)}`;
}

function trim(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export type BarSeries = { name: string; color: string };
export type BarDatum = { label: string; values: number[] };

/** Vertical grouped bar chart with horizontal gridlines and a compact value axis. */
export function BarChart({
  data,
  series,
  height = 180,
}: {
  data: BarDatum[];
  series: BarSeries[];
  height?: number;
}) {
  const [width, setWidth] = React.useState(0);
  const axisWidth = 38;
  const bottomPad = 22;
  const topPad = 8;
  const plotHeight = height - bottomPad - topPad;
  const plotWidth = Math.max(width - axisWidth, 0);
  const max = niceMax(Math.max(0, ...data.flatMap((item) => item.values)));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const groupWidth = data.length > 0 ? plotWidth / data.length : 0;
  const barGap = 3;
  const barWidth = Math.max(
    Math.min((groupWidth * 0.62) / Math.max(series.length, 1) - barGap, 22),
    3,
  );
  const clusterWidth = series.length * barWidth + (series.length - 1) * barGap;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((tick) => {
            const y = topPad + plotHeight * (1 - tick);
            return (
              <G key={tick}>
                <Line
                  x1={axisWidth}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <SvgText
                  x={axisWidth - 6}
                  y={y + 3}
                  fontSize={9}
                  fill="#64748B"
                  textAnchor="end"
                >
                  {compactNumber(max * tick)}
                </SvgText>
              </G>
            );
          })}
          {data.map((item, groupIndex) => {
            const groupX =
              axisWidth +
              groupIndex * groupWidth +
              (groupWidth - clusterWidth) / 2;
            return (
              <G key={item.label}>
                {item.values.map((value, seriesIndex) => {
                  const barHeight = (value / max) * plotHeight;
                  return (
                    <Rect
                      key={series[seriesIndex].name}
                      x={groupX + seriesIndex * (barWidth + barGap)}
                      y={topPad + plotHeight - barHeight}
                      width={barWidth}
                      height={Math.max(barHeight, value > 0 ? 1 : 0)}
                      rx={2}
                      fill={series[seriesIndex].color}
                    />
                  );
                })}
                <SvgText
                  x={axisWidth + groupIndex * groupWidth + groupWidth / 2}
                  y={height - 6}
                  fontSize={9}
                  fill="#64748B"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <Legend
        items={series.map((item) => ({ label: item.name, color: item.color }))}
      />
    </View>
  );
}

export type Slice = { label: string; value: number; color: string };

/** Donut chart with a centre label and a legend showing each slice's share. */
export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 132,
  formatValue = compactNumber,
}: {
  slices: Slice[];
  centerLabel: string;
  centerValue: string;
  size?: number;
  formatValue?: (value: number) => string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={stroke}
              fill="none"
            />
            {total > 0
              ? slices.map((slice) => {
                  const length = (slice.value / total) * circumference;
                  const circle = (
                    <Circle
                      key={slice.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={slice.color}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += length;
                  return circle;
                })
              : null}
          </G>
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text
            style={styles.donutValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {centerValue}
          </Text>
          <Text style={styles.donutLabel}>{centerLabel}</Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {slices.map((slice) => (
          <View key={slice.label} style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: slice.color }]}
            />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {slice.label}
            </Text>
            <Text style={styles.legendValue}>
              {total > 0 ? `${Math.round((slice.value / total) * 100)}%` : "0%"}
            </Text>
            <Text style={styles.legendAmount}>{formatValue(slice.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export type RankItem = { label: string; value: number; caption?: string };

/** Horizontal ranked bars, scaled against the largest value in the list. */
export function RankedBars({
  items,
  color,
  formatValue,
  emptyText = "No data available.",
}: {
  items: RankItem[];
  color: string;
  formatValue: (value: number) => string;
  emptyText?: string;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  if (items.length === 0 || max <= 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.rankList}>
      {items.map((item) => (
        <View key={item.label} style={styles.rankItem}>
          <View style={styles.rankHeader}>
            <Text style={styles.rankLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.rankValue}>{formatValue(item.value)}</Text>
          </View>
          <View style={styles.rankTrack}>
            <View
              style={[
                styles.rankFill,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          {item.caption ? (
            <Text style={styles.rankCaption}>{item.caption}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function Legend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", gap: 14, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { color: "#475569", fontSize: 11 },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  donutValue: { color: "#0F172A", fontSize: 16, fontWeight: "800" },
  donutLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  donutLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendLabel: { flex: 1, color: "#334155", fontSize: 11 },
  legendValue: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 30,
    textAlign: "right",
  },
  legendAmount: {
    color: "#64748B",
    fontSize: 10,
    minWidth: 40,
    textAlign: "right",
  },
  rankList: { gap: 12 },
  rankItem: { gap: 5 },
  rankHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rankLabel: { flex: 1, color: "#0F172A", fontSize: 12, fontWeight: "600" },
  rankValue: { color: "#0F172A", fontSize: 12, fontWeight: "700" },
  rankTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  rankFill: { height: "100%", borderRadius: 3 },
  rankCaption: { color: "#64748B", fontSize: 10 },
  empty: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 14,
  },
});

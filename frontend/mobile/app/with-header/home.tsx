import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { router, Href } from "expo-router";
import { Colors, Typography } from "@/theme";
import Svg, { Path, Text as SvgText } from "react-native-svg";

const AVAILABILITY = [
  { label: "disponibles", value: 7, color: Colors.success },
  { label: "reservados", value: 2, color: Colors.warning },
  { label: "ocupados", value: 3, color: Colors.danger },
];

const MOCK_RESERVATIONS = [
  { plate: "LMNN77", time: "19:42 - 21:42", rut: "20.109.691-K" },
  { plate: "UHGT73", time: "19:43 - 21:43", rut: "12.345.678-9" },
];

function goTo(path: Href) {
  return () => router.push(path);
}

function createPiePaths(data: typeof AVAILABILITY, radius: number, startAngleOffset = -Math.PI / 2) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = startAngleOffset;
  return data.map((slice) => {
    const angle = (slice.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M${radius},${radius}`,
      `L${x1},${y1}`,
      `A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
      "Z",
    ].join(" ");

    // posición de etiqueta (mitad del arco)
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.6; // más cerca del centro
    const labelX = radius + labelRadius * Math.cos(midAngle);
    const labelY = radius + labelRadius * Math.sin(midAngle);

    const percent = Math.round((slice.value / total) * 100);

    startAngle = endAngle;
    return { path: pathData, color: slice.color, percent, labelX, labelY };
  });
}


export default function Home() {
  const size = 120; // tamaño del gráfico
  const radius = size / 2;
  const paths = createPiePaths(AVAILABILITY, radius);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reserva de estacionamientos</Text>

        <View style={styles.cardBody}>
          <View>
            {AVAILABILITY.map((item, index) => (
              <View
                key={item.label}
                style={[styles.statusRow, index > 0 && styles.statusRowSpacing]}
              >
                <View style={[styles.statusBadge, { borderColor: item.color }]}>
                  <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
                </View>
                <Text style={styles.statusLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/*Pie chart con react-native-svg */}
          <View style={styles.chartWrapper}>
            <Svg width={size} height={size}>
              {paths.map((slice, i) => (
                <React.Fragment key={i}>
                  <Path d={slice.path} fill={slice.color} />
                  <SvgText
                    x={slice.labelX}
                    y={slice.labelY}
                    fill="#fff"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {slice.percent}%
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>

          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.reserveButton]}
          onPress={goTo("/with-header/booking")}
        >
          <Text style={styles.actionButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anular reservas</Text>

        <View style={styles.reservationsBox}>
          {MOCK_RESERVATIONS.map((item, index) => (
            <View key={item.plate} style={[styles.reservationRow, index > 0 && styles.separator]}>
              <View style={styles.reservationLeft}>
                <Text style={styles.reservationPlate}>{item.plate}</Text>
                <Text style={styles.reservationRut}>{item.rut}</Text>
              </View>
              <Text style={styles.reservationTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={goTo("/with-header/cancelBookings")}
          accessibilityRole="button"
          accessibilityLabel="Ir a anular reservas"
        >
          <Text style={styles.actionButtonText}>Anular reservas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#dfe4ea",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
    marginBottom: 16,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartWrapper: {
    width: '50%',
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRowSpacing: {
    marginTop: 12,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  statusValue: {
    fontSize: Typography.h2,
    fontWeight: "700",
  },
  statusLabel: {
    fontSize: Typography.body,
    color: Colors.gray,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  reserveButton: {
    backgroundColor: Colors.accent,
  },
  cancelButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
  reservationsBox: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 16,
  },
  reservationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  reservationLeft: {
    flexShrink: 1,
  },
  reservationPlate: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.dark,
  },
  reservationRut: {
    fontSize: Typography.small,
    color: Colors.gray,
    marginTop: 2,
  },
  reservationTime: {
    fontSize: Typography.body,
    color: Colors.dark,
    marginLeft: 16,
    textAlign: "right",
  },
});



import { describe, expect, it } from "vitest";

import {
  buildSmartBinBridgeResponse,
  createOfflineSmartBinBridgeResponse,
  isSmartBinSensorLogTerminator,
  parseSmartBinSerialLine,
  parseSmartBinSensorLogBlock,
} from "@/lib/smartBinBridge";

describe("smartBin bridge helpers", () => {
  it("parses JSON serial lines with two sensor distances", () => {
    expect(
      parseSmartBinSerialLine('{"plasticDistanceCm":4,"organicDistanceCm":9}'),
    ).toEqual({
      plasticDistanceCm: 4,
      organicDistanceCm: 9,
    });
  });

  it("parses the current esp32 sensor hub json format", () => {
    expect(
      parseSmartBinSerialLine('{"device_id":"esp32-c3-sensor-hub","ts_ms":3999609,"hc_sr04_cm":null,"us016_cm":31.20879,"temperature_c":null,"hc_sr04_ok":false,"us016_ok":true,"dht22_ok":false,"status":"sensor_error","transport":"usb_serial","debug":"hc_sr04_timeout+dht22_read_failed"}'),
    ).toEqual({
      plasticDistanceCm: null,
      organicDistanceCm: 31.20879,
    });
  });

  it("builds fill levels from serial distances", () => {
    const response = buildSmartBinBridgeResponse(
      {
        plasticDistanceCm: 4,
        organicDistanceCm: 9,
      },
      "2026-06-11T12:00:00.000Z",
    );

    expect(response.ok).toBe(true);
    expect(response.sections.plastic.fillLevel).toBe(73);
    expect(response.sections.plastic.status).toBe("warning");
    expect(response.sections.organic.fillLevel).toBe(40);
    expect(response.sections.organic.status).toBe("normal");
  });

  it("supports partial sensor failures", () => {
    const response = buildSmartBinBridgeResponse(
      {
        plasticDistanceCm: 4,
        organicDistanceCm: null,
      },
      "2026-06-11T12:00:00.000Z",
    );

    expect(response.sections.plastic.isOffline).toBe(false);
    expect(response.sections.organic.isOffline).toBe(true);
    expect(response.sections.organic.fillLevel).toBeNull();
  });

  it("parses a sensor monitor block with both distances", () => {
    expect(
      parseSmartBinSensorLogBlock([
        "ESP32-C3 Sensor Monitor Started",
        "HC-SR04 Distance: 12.3 cm",
        "US-016 Distance: 8.7 cm",
        "Temperature: 25.1 C",
      ]),
    ).toEqual({
      plasticDistanceCm: 12.3,
      organicDistanceCm: 8.7,
    });
  });

  it("supports sensor blocks with no echo on HC-SR04 and valid US-016", () => {
    expect(
      parseSmartBinSensorLogBlock([
        "HC-SR04: no echo / out of range",
        "US-016 Distance: 8.7 cm",
      ]),
    ).toEqual({
      plasticDistanceCm: null,
      organicDistanceCm: 8.7,
    });
  });

  it("supports sensor blocks with only US-016 distance", () => {
    expect(
      parseSmartBinSensorLogBlock([
        "========== SENSOR DATA ==========",
        "US-016 Distance: 18.5 cm",
      ]),
    ).toEqual({
      plasticDistanceCm: null,
      organicDistanceCm: 18.5,
    });
  });

  it("ignores noisy blocks without valid distance values", () => {
    expect(
      parseSmartBinSensorLogBlock([
        "ESP32-C3 Sensor Monitor Started",
        "HC-SR04 + US-016 + DHT22",
        "Temperature: 24.8 C",
        "Humidity: 41 %",
        "HC-SR04: no echo / out of range",
      ]),
    ).toBeNull();
  });

  it("recognizes sensor log block terminators", () => {
    expect(isSmartBinSensorLogTerminator("")).toBe(true);
    expect(isSmartBinSensorLogTerminator("=================================")).toBe(true);
    expect(isSmartBinSensorLogTerminator("US-016 Distance: 8.7 cm")).toBe(false);
  });

  it("returns an offline response when there is no serial data", () => {
    const response = createOfflineSmartBinBridgeResponse({
      error: "No serial data yet",
    });

    expect(response.ok).toBe(false);
    expect(response.error).toBe("No serial data yet");
    expect(response.sections.plastic.status).toBe("offline");
    expect(response.sections.organic.status).toBe("offline");
  });
});

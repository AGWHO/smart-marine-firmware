import OPi.GPIO as GPIO
import time
import json

TRIG = "PC7"
ECHO = "PC8"
RAIN = "PC6"
WIND = "PC10"  # NEW

GPIO.setwarnings(False)
GPIO.setmode(GPIO.SUNXI)

GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)
GPIO.setup(RAIN, GPIO.IN)
GPIO.setup(WIND, GPIO.IN)

# ===== WIND VARIABLES =====
wind_pulse_count = 0
wind_speed_ms = 0.0
wind_speed_kmh = 0.0
last_wind_time = time.time()
WIND_FACTOR = 0.667

def count_wind_pulse(channel):
    global wind_pulse_count
    wind_pulse_count += 1

GPIO.add_event_detect(WIND, GPIO.FALLING, callback=count_wind_pulse, bouncetime=2)
 
print("Smart Marine Prototype Firmware - Version 1.0")

def measure_distance():
    GPIO.output(TRIG, False)
    time.sleep(0.05)

    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    pulse_start = None
    pulse_end = None

    timeout = time.time() + 0.03
    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()
        if time.time() > timeout:
            return None

    timeout = time.time() + 0.03
    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()
        if time.time() > timeout:
            return None

    if pulse_start is None or pulse_end is None:
        return None

    duration = pulse_end - pulse_start
    distance = duration * 17150
    return round(distance, 2)

def get_rain_status():
    return "DETECTED" if GPIO.input(RAIN) == 0 else "NONE"

try:
    while True:
        # ===== EXISTING SENSORS =====
        distance = measure_distance()
        rain_status = get_rain_status()

        if distance is None:
            obstacle_status = "NO READING"
            distance_value = None
        elif distance <= 20:
            obstacle_status = "DETECTED"
            distance_value = distance
        else:
            obstacle_status = "CLEAR"
            distance_value = distance

        # ===== WIND CALCULATION =====
        current_time = time.time()
        elapsed = current_time - last_wind_time

        if elapsed >= 3.0:
            frequency = wind_pulse_count / elapsed
            wind_speed_ms = frequency * WIND_FACTOR
            wind_speed_kmh = wind_speed_ms * 3.6

            wind_pulse_count = 0
            last_wind_time = current_time

        # ===== DATA OUTPUT =====
        data = {
            "rain": rain_status,
            "obstacle": obstacle_status,
            "distance_cm": distance_value,
            "wind_ms": round(wind_speed_ms, 2),
            "wind_kmh": round(wind_speed_kmh, 2),
            "gps": "UNAVAILABLE"
        }

        with open("status.json", "w") as f:
            json.dump(data, f)

        print("\n--- BOAT STATUS ---")
        print(f"Rain: {rain_status}")
        print(f"Obstacle: {obstacle_status}")
        print(f"Distance: {distance_value} cm")
        print(f"Wind: {wind_speed_kmh:.2f} km/h")  # NEW
        print("GPS: UNAVAILABLE")

        time.sleep(2)

except KeyboardInterrupt:
    print("\nShutting down system...")
    GPIO.cleanup()

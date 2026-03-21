import OPi.GPIO as GPIO
import time
import json
from smbus import SMBus
import math

# ===== PIN SETUP =====
TRIG = "PC7"
ECHO = "PC8"
RAIN = "PC6"
WIND = "PC10"

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

# ===== TILT SENSOR (MPU6050) =====
bus = SMBus(2)   # your working I2C bus
MPU_ADDR = 0x68

# Wake up MPU6050
bus.write_byte_data(MPU_ADDR, 0x6B, 0)

def read_word(reg):
    high = bus.read_byte_data(MPU_ADDR, reg)
    low = bus.read_byte_data(MPU_ADDR, reg + 1)
    value = (high << 8) + low
    if value > 32768:
        value -= 65536
    return value

def get_tilt_angle():
    x = read_word(0x3B)
    y = read_word(0x3D)
    z = read_word(0x3F)

    x /= 16384.0
    y /= 16384.0
    z /= 16384.0

    angle = math.degrees(math.atan2(x, math.sqrt(y*y + z*z)))
    return angle

def get_tilt_status(angle):
    if abs(angle) < 15:
        return "FLAT"
    elif abs(angle) < 35:
        return "SLIGHT TILT"
    else:
        return "DANGER TILT"

print("Smart Marine Prototype Firmware - Version 2.0")

# ===== ULTRASONIC FUNCTION =====
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

# ===== RAIN FUNCTION =====
def get_rain_status():
    return "DETECTED" if GPIO.input(RAIN) == 0 else "NONE"

# ===== MAIN LOOP =====
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

        # ===== TILT SENSOR =====
        tilt_angle = get_tilt_angle()
        tilt_status = get_tilt_status(tilt_angle)

        # ===== DATA OUTPUT =====
        data = {
            "rain": rain_status,
            "obstacle": obstacle_status,
            "distance_cm": distance_value,
            "wind_ms": round(wind_speed_ms, 2),
            "wind_kmh": round(wind_speed_kmh, 2),
            "tilt_angle": round(tilt_angle, 2),
            "tilt_status": tilt_status,
            "gps": "UNAVAILABLE"
        }

        with open("status.json", "w") as f:
            json.dump(data, f)

        # ===== TERMINAL OUTPUT =====
        print("\n--- BOAT STATUS ---")
        print(f"Rain: {rain_status}")
        print(f"Obstacle: {obstacle_status}")
        print(f"Distance: {distance_value} cm")
        print(f"Wind: {wind_speed_kmh:.2f} km/h")
        print(f"Tilt: {tilt_angle:.2f}° ({tilt_status})")
        print("GPS: UNAVAILABLE")

        time.sleep(2)

except KeyboardInterrupt:
    print("\nShutting down system...")
    GPIO.cleanup()

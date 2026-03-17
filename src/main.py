import OPi.GPIO as GPIO
import time
import json

TRIG = "PC7"
ECHO = "PC8"
RAIN = "PC6"

GPIO.setmode(GPIO.SUNXI)

GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)
GPIO.setup(RAIN, GPIO.IN)

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

        data = {
            "rain": rain_status,
            "obstacle": obstacle_status,
            "distance_cm": distance_value,
            "gps": "UNAVAILABLE"
        }

        with open("status.json", "w") as f:
            json.dump(data, f)

        print("\n--- BOAT STATUS ---")
        print(f"Rain: {rain_status}")
        print(f"Obstacle: {obstacle_status}")
        print(f"Distance: {distance_value} cm")
        print("GPS: UNAVAILABLE")

        time.sleep(2)

except KeyboardInterrupt:
    print("\nShutting down system...")
    GPIO.cleanup()

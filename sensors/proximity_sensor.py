import OPi.GPIO as GPIO
import time

TRIG = "PC7"
ECHO = "PC8"

GPIO.setmode(GPIO.SUNXI)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

print("Proximity Sensor Firmware v1.1")

def measure():
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
    return distance

try:
    while True:
        readings = []

        for _ in range(5):
            d = measure()
            if d is not None and 5 <= d <= 450:
                readings.append(d)
            time.sleep(0.05)

        if not readings:
            print("No valid echo")
            continue

        avg_distance = sum(readings) / len(readings)
        print("Distance:", round(avg_distance, 2), "cm")

        time.sleep(0.2)

except KeyboardInterrupt:
    print("Stopped by user")

finally:
    GPIO.cleanup()

import OPi.GPIO as GPIO
import time

WIND_PIN = "PC10"

pulse_count = 0

def count_pulse(channel):
    global pulse_count
    pulse_count += 1

GPIO.setmode(GPIO.SUNXI)
GPIO.setup(WIND_PIN, GPIO.IN)
GPIO.add_event_detect(WIND_PIN, GPIO.FALLING, callback=count_pulse)

print("Wind sensor running...")

try:
    while True:
        time.sleep(3)

        frequency = pulse_count / 3.0
        wind_speed = frequency * 0.667

        print(f"Freq: {frequency:.2f} Hz | Speed: {wind_speed:.2f} m/s")

        pulse_count = 0

except KeyboardInterrupt:
    GPIO.cleanup()

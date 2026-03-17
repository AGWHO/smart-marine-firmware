import OPi.GPIO as GPIO
import time

RAIN = "PC6"

GPIO.setmode(GPIO.SOC)
GPIO.setup(RAIN, GPIO.IN)

try:
    while True:
        state = GPIO.input(RAIN)

        if state == 0:
            print("Rain detected")
        else:
            print("No rain")

        time.sleep(1)

except KeyboardInterrupt:
    print("\nStopped")
    GPIO.cleanup()

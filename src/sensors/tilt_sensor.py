from smbus import SMBus
import time
import math

bus = SMBus(2)   # your working I2C bus
addr = 0x68

# Wake up MPU6050
bus.write_byte_data(addr, 0x6B, 0)

def read_word(reg):
    high = bus.read_byte_data(addr, reg)
    low = bus.read_byte_data(addr, reg+1)
    value = (high << 8) + low
    if value > 32768:
        value -= 65536
    return value

while True:
    x = read_word(0x3B)
    y = read_word(0x3D)
    z = read_word(0x3F)

    x /= 16384.0
    y /= 16384.0
    z /= 16384.0

    angle = math.degrees(math.atan2(x, math.sqrt(y*y + z*z)))

    print(f"Angle: {angle:.2f}°")

    if abs(angle) < 15:
        print("Flat")
    elif abs(angle) < 35:
        print("Slight Tilt")
    else:
        print("Danger Tilt")

    print("-------------------")

    time.sleep(1)

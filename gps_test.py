import serial

gps = serial.Serial('/dev/ttyS3',9600, timeout=1)

print("Reading GPS data...")

try:
    while True:
        line = gps.readline().decode('ascii', errors='replace').strip()
        if line:
            print(line)

except KeyboardInterrupt:
    gps.close()

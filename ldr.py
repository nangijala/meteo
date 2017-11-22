#! /usr/bin/python
# Example for RC timing reading for Raspberry Pi
# Must be used with GPIO 0.3.1a or later - earlier verions
# are not fast enough!

from __future__ import print_function

import RPi.GPIO as GPIO, time, os      


DEBUG = 1
GPIO.setmode(GPIO.BCM)

def RCtime (RCpin):
        reading = 0
        GPIO.setup(RCpin, GPIO.OUT)
        GPIO.output(RCpin, GPIO.LOW)
        time.sleep(0.5)

        GPIO.setup(RCpin, GPIO.IN)
        # This takes about 1 millisecond per loop cycle
        while (GPIO.input(RCpin) == GPIO.LOW and reading < 200000):
                reading += 1
        return reading

try:
	loops = 4
	count = 0
	total = 0
	while count < loops:                                    
		total += RCtime(17)     # Read RC timing using pin #18
		count+=1
	print(total/loops, end='')

except KeyboardInterrupt:
	pass
finally:
	GPIO.cleanup()


#!/usr/bin/env python3

import datetime
import json
import os
import sys
import signal
import traceback
from datetime import datetime

import aprslib

# https://aprs-python.readthedocs.io/en/latest/

def callback(packet):
    raw = packet[1]  # The raw packet data is now the second element of the input
    date = packet[0]  # The date is the first element of the input

    info = aprslib.parse(raw)

    lat = info.get("latitude", 0)
    lon = info.get("longitude", 0)
    cmt = info.get("comment", "")
    call = info.get("from", "")
    alt = info.get("altitude", 0)
    speed = info.get("speed", 0)

    _, info = aprslib.parsing.weather.parse_weather_data(cmt)

    temp = info.get("temperature", "")
    humi = info.get("humidity", "")
    pres = info.get("pressure", "")

    ozone_ppb = ""
    ozone_ppm = ""
    alt_max = ""
    count = ""
    rate = ""

    try:
        parts = cmt.split(" ")
        for part in parts:
            if part.startswith("Am"):
                alt_max = part[3:]
                alt_max = int(alt_max) * 0.3048  # feet to m
            if part.startswith("Ct"):
                count = int(part[3:], 16)  # hex
            if part.startswith("Zr"):
                rate = float(part[3:])
            if part.startswith("O3b"):
                ozone_ppb = float(part[4:])
            if part.startswith("O3m"):
                ozone_ppm = float(part[4:])
    except Exception:
        alt_max = ""
        count = ""
        rate = ""
        ozone_ppb = ""
        ozone_ppm = ""

    data = {
        "date": date,
        "call": call,
        "lat": lat,
        "lon": lon,
        "alt": alt,
        "temp": temp,
        "humi": humi,
        "pres": pres,
        "alt_max": alt_max,
        "count": count,
        "rate": rate,
        "speed": speed,
    }

    # check if ozone data is available
    if (ozone_ppb != "" and ozone_ppm != ""):
        data["ozone_ppb"] = ozone_ppb
        data["ozone_ppm"] = ozone_ppm

    return data

def excepthook(exc_typ, exc_val, tb):
    traceback.print_exception(exc_val)
    traceback.print_tb(tb)
    os.kill(os.getpid(), signal.SIGKILL)

if __name__ == "__main__":
    sys.excepthook = excepthook

    parsed_data = []

    raw_data_list = []

    for raw in raw_data_list:
        try:
            data = callback(raw)
            parsed_data.append(data)
        except KeyboardInterrupt:
            pass

    with open("output_file" + str(datetime.now()) + ".json", 'w') as f:
        json.dump(parsed_data, f, indent=4, ensure_ascii=False)
#!/usr/bin/env python3

import datetime
import pprint
import os
import sys
import signal
import traceback
import requests

import aprslib

# https://aprs-python.readthedocs.io/en/latest/


# watchlist = ["dd1rk", "do3rt"]
watchlist = ["dd1rk-11"]


def callback(packet):

    if not packet["from"].lower().startswith(tuple(watchlist)):
        return
        # pass

    now = datetime.datetime.now()
    now = now.strftime("%Y-%m-%d %H:%M:%S")
    raw = packet["raw"]

    call = packet["from"]
    # print("recv ", call)

    lat = packet.get("latitude", 0)
    lon = packet.get("longitude", 0)
    cmt = packet.get("comment", "")

    # "DD1RK-11>APRS,qAO,DL0POR-10:!/6!M.QoUUOv3H.../...t074h53b09787/A=001305 Am=001485 Ct=d Zr=0.70 F O3b=54.31 O3m=-0.99"

    pkt = packet["raw"]
    # pkt = pkt.replace(".../...g", "g")

    info = aprslib.parse(pkt)
    pprint.pprint(info)

    alt = info.get("altitude", 0)

    _, info = aprslib.parsing.weather.parse_weather_data(cmt)
    pprint.pprint(info)

    temp = info.get("temperature", "")
    humi = info.get("humidity", "")
    pres = info.get("pressure", "")

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

    print(call, lat, lon, alt, temp, humi, pres)
    print("")

    data = {
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
        "ozone_ppb": ozone_ppb,
        "ozone_ppm": ozone_ppm
    }

    response = requests.post("http://localhost:8080", json=data)
    if response.status_code != 200:
        print(f"Failed to send data to server: {response.text}")


def excepthook(exc_typ, exc_val, tb):
    traceback.print_exception(exc_val)
    traceback.print_tb(tb)
    os.kill(os.getpid(), signal.SIGKILL)


if __name__ == "__main__":
    sys.excepthook = excepthook
    # raise Exception("foo")

    ais = aprslib.IS("N0CALL")
    ais.connect()

    print("connected")
    try:
        # ais.consumer(callback, raw=True)
        ais.consumer(callback)
    except KeyboardInterrupt:
        pass

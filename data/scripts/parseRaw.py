#!/usr/bin/env python3

import os
import pprint
import logging
import sys
import signal
import traceback
import json
from typing import Dict

# https://aprs-python.readthedocs.io/en/latest/
import aprslib

logging.basicConfig(level=logging.INFO)


class Packet:
    def __init__(self, raw: str, ts: str) -> None:
        # in TNC2 format
        self.raw = raw
        self.ts = ts

        self.via = ""
        self.lat = 0
        self.lon = 0
        self.alt = 0
        self.cmt = ""
        self.tmp = 0
        self.hum = 0
        self.pss = 0
        self.alt_max = 0
        self.count = -1
        self.rate = 0
        self.ozone_ppb = 0
        self.ozone_ppm = 0

    def parse(self) -> 'Packet':
        info = aprslib.parse(self.raw)
        self.via = info.get("via", "")
        self.lat = info.get("latitude", 0)
        self.lon = info.get("longitude", 0)
        self.alt = info.get("altitude", 0)
        self.cmt = info.get("comment", "")

        # Add leading zeros to pressure value in comment
        if self.cmt and self.cmt.startswith("t"):
            parts = self.cmt.split(" ")
            b_index = parts[0].find("b")
            if b_index != -1:
                pressure_part = parts[0][b_index+1:]
                if len(pressure_part) < 5:  # Corrected length check
                    parts[0] = parts[0][:b_index+1] + \
                        pressure_part.zfill(5)  # Corrected padding
                    self.cmt = " ".join(parts)

        if self.cmt:
            self.parse_weather_data()
            self.parse_comment_data()

        return self

    def parse_weather_data(self) -> None:
        _, wx = aprslib.parsing.weather.parse_weather_data(self.cmt)

        self.tmp = wx.get("temperature", 0)
        self.hum = wx.get("humidity", 0)
        self.pss = wx.get("pressure", 0)

        if self.pss == 0 and self.cmt.startswith("t"):
            try:
                self.pss = int(self.cmt.split(" ")[0][9:])
            except Exception as e:
                logging.error(f"Error parsing pressure: {e}")

    def parse_comment_data(self) -> None:
        prefix_map = {
            "Am=": ("alt_max", int, 0.3048),  # ft to m
            "Ct=": ("count", lambda x: int(x, 16), 1),  # hex to dec
            "Zr=": ("rate", float, 1),  # m/s
        }

        for part in self.cmt.split(" "):
            for prefix, (attr, func, multiplier) in prefix_map.items():
                if part.startswith(prefix):
                    try:
                        setattr(self, attr, func(
                            part[len(prefix):]) * multiplier)
                    except Exception as e:
                        logging.error(f"Error parsing {prefix}: {e}")

    def to_dict(self) -> Dict[str, float]:
        return {
            "date": self.ts,
            "via": self.via,
            "lat": self.lat,
            "lon": self.lon,
            "alt": self.alt,
            "alt_max": self.alt_max,
            "tmp": self.tmp,
            "hum": self.hum,
            "pss": self.pss,
            "count": self.count,
            "rate": self.rate
        }


if __name__ == "__main__":
    parsed_data = []

    with open("../raw_packets/packets.json", 'r') as f:
        data = json.load(f)
        parsed_data = [Packet(raw[1], raw[0]).parse() for raw in data]

    # Filter out packets with no data
    parsed_data = [data for data in parsed_data if data.count != -1]

    with open("../unfiltered/output_file.json", 'w') as f:
        f.write(json.dumps([data.to_dict()
                for data in parsed_data], indent=4, ensure_ascii=False))

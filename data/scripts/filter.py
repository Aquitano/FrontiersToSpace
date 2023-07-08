#!/usr/bin/env python3

import os
import sys
import json
from typing import TypedDict, List

# Define the structure of the data
class RawData(TypedDict):
    date: str
    call: str
    lat: float
    lon: float
    alt: float
    temp: float
    humi: int
    pres: float
    alt_max: float
    count: int
    rate: float
    speed: float

# Read raw data from files
def read_raw_data() -> List[RawData]:
    raw_data_list = []
    for filename in os.listdir("../unfiltered"):
        if filename.endswith(".json"):
            with open("../unfiltered/" + filename, 'r') as f:
                # Read array of json objects
                raw_data_list.extend(json.load(f))

    return raw_data_list

# Function to filter out empty data
def filter_empty_data(raw_data_list: List[RawData]) -> List[RawData]:
    # Use list comprehension to filter out data with empty or zero values
    return [raw_data for raw_data in raw_data_list if all(raw_data[key] for key in raw_data.keys())]

# Filter out duplicate data
def filter_duplicate_data(raw_data_list: List[RawData]) -> List[RawData]:
    # Convert list of dictionaries to list of tuples, then to set to remove duplicates, then back to list of dictionaries
    return [dict(t) for i, t in enumerate(map(dict.items, raw_data_list)) if raw_data_list.index(dict(t)) == i]


if __name__ == "__main__":
    # Read raw data
    raw_data_list = read_raw_data()
    print(f"Initial data count: {len(raw_data_list)}")

    # Filter out empty data
    filtered_data_list = filter_empty_data(raw_data_list)
    print(f"Data count after filtering out empty data: {len(filtered_data_list)}")

    # Filter out duplicate data
    unique_data_list = filter_duplicate_data(filtered_data_list)
    print(f"Data count after filtering out duplicate data: {len(unique_data_list)}")

    sys.exit(0)
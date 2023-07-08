#!/usr/bin/env python3

import os
import sys
import json
from typing import TypedDict, List, Dict
from collections import defaultdict

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
    # Use list comprehension to filter out data with empty or zero values in specific fields
    return [raw_data for raw_data in raw_data_list if all(raw_data[key] for key in ['lat', 'lon', 'alt', 'alt_max', 'humi', 'pres'])]

# Filter out duplicate data
def filter_duplicate_data(raw_data_list: List[RawData]) -> List[RawData]:
    # Convert list of dictionaries to list of tuples, then to set to remove duplicates, then back to list of dictionaries
    return [dict(t) for i, t in enumerate(map(dict.items, raw_data_list)) if raw_data_list.index(dict(t)) == i]

# Function to order data by date
def order_data_by_date(raw_data_list: List[RawData]) -> List[RawData]:
    # Use sorted function with a lambda function as the key
    return sorted(raw_data_list, key=lambda x: x['date'])

# Function to include each 'count' value only once
def include_each_count_once(raw_data_list: List[RawData]) -> List[RawData]:
    seen_counts = set()
    unique_count_data_list = []
    for raw_data in raw_data_list:
        if raw_data['count'] not in seen_counts:
            seen_counts.add(raw_data['count'])
            unique_count_data_list.append(raw_data)
    return unique_count_data_list

# Function to get data where more than one data point is present in a single minute
def get_multiple_data_points_per_minute(raw_data_list: List[RawData]) -> Dict[str, List[RawData]]:
    # Group data by minute
    data_by_minute = defaultdict(list)
    for raw_data in raw_data_list:
        # Extract the minute from the date string
        minute = raw_data['date'][:16]  # 'YYYY-MM-DD HH:MM'
        data_by_minute[minute].append(raw_data)

    # Filter out minutes with only one data point
    return {minute: data for minute, data in data_by_minute.items() if len(data) > 1}


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

    # Order data by date
    ordered_data_list = order_data_by_date(unique_data_list)
    print(f"Data count after ordering by date: {len(ordered_data_list)}")

    # Include each 'count' value only once
    unique_count_data_list = include_each_count_once(ordered_data_list)
    print(f"Data count after including each 'count' value only once: {len(unique_count_data_list)}")

    # Print out all dates that are present more than once
    # dates = [data['date'] for data in unique_count_data_list]
    # print(f"Dates that are present more than once: {[date for date in dates if dates.count(date) > 1]}")
    
    # Get data where more than one data point is present in a single minute
    # multiple_data_points_per_minute = get_multiple_data_points_per_minute(unique_count_data_list)
    # print(f"Data count where more than one data point is present in a single minute: {sum([len(data) for data in multiple_data_points_per_minute.values()])}")
    # print(f"Minutes where more than one data point is present: {list(multiple_data_points_per_minute.keys())}")

    # Write filtered data to file
    with open("../filtered_data.json", 'w') as f:
        json.dump(ordered_data_list, f, indent=4)

    sys.exit(0)
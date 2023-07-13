import pandas as pd
import json

# Load the data
with open("../unfiltered/output_file.json") as f:
    data = json.load(f)

# Convert the data to a pandas DataFrame
df = pd.DataFrame(data)

# Function to calculate outliers


def detect_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    return df[(df[column] < lower_bound) | (df[column] > upper_bound)]


# Detect outliers in temperature, altitude, and pressure
temperature_outliers = detect_outliers(df, 'tmp')
altitude_outliers = detect_outliers(df, 'alt')
pressure_outliers = detect_outliers(df, 'pss')

# Print out the outliers
print("Temperature outliers:")
print(temperature_outliers)
print("\nAltitude outliers:")
print(altitude_outliers)
print("\nPressure outliers:")
print(pressure_outliers)

import csv

scatter = [
    [1, 2], [2, 3], [3, 5], [4, 4], [5, 7]
]
bar = [
    ["A", 10], ["B", 20], ["C", 15], ["D", 25], ["E", 30]
]
pie = [
    ["Product A", 300], ["Product B", 500], ["Product C", 100]
]
map_data = [
    ["London", 51.5074, -0.1278, 8908081],
    ["Paris", 48.8566, 2.3522, 2148271],
    ["Berlin", 52.5200, 13.4050, 3769495],
    ["Rome", 41.9028, 12.4964, 2873000],
    ["Madrid", 40.4168, -3.7038, 3223000],
    ["Tokyo", 35.6762, 139.6503, 13960000],
    ["New York", 40.7128, -74.0060, 8336817],
    ["Sydney", -33.8688, 151.2093, 5312000]
]
usa = [
    ["AL", "Alabama", 45], ["AK", "Alaska", 10], ["AZ", "Arizona", 78], ["AR", "Arkansas", 32],
    ["CA", "California", 95], ["CO", "Colorado", 67], ["CT", "Connecticut", 58], ["DE", "Delaware", 25],
    ["FL", "Florida", 88], ["GA", "Georgia", 72], ["HI", "Hawaii", 15], ["ID", "Idaho", 44],
    ["IL", "Illinois", 70], ["IN", "Indiana", 55], ["IA", "Iowa", 40], ["KS", "Kansas", 38],
    ["KY", "Kentucky", 48], ["LA", "Louisiana", 42], ["ME", "Maine", 22], ["MD", "Maryland", 65],
    ["MA", "Massachusetts", 80], ["MI", "Michigan", 68], ["MN", "Minnesota", 62], ["MS", "Mississippi", 30],
    ["MO", "Missouri", 52], ["MT", "Montana", 20], ["NE", "Nebraska", 35], ["NV", "Nevada", 12],
    ["NH", "New Hampshire", 28], ["NJ", "New Jersey", 85], ["NM", "New Mexico", 36], ["NY", "New York", 92],
    ["NC", "North Carolina", 74], ["ND", "North Dakota", 18], ["OH", "Ohio", 66], ["OK", "Oklahoma", 46],
    ["OR", "Oregon", 54], ["PA", "Pennsylvania", 76], ["RI", "Rhode Island", 24], ["SC", "South Carolina", 50],
    ["SD", "South Dakota", 16], ["TN", "Tennessee", 56], ["TX", "Texas", 82], ["UT", "Utah", 49],
    ["VT", "Vermont", 21], ["VA", "Virginia", 71], ["WA", "Washington", 64], ["WV", "West Virginia", 29],
    ["WI", "Wisconsin", 59], ["WY", "Wyoming", 14]
]
features = [
    [0, 0], [1, 1], [2, 0], [3, -1], [4, 0], [5, 1], [6, 0]
]
strip = [
    ["A", 1], ["A", 2], ["A", 2], ["B", 3], ["B", 3], ["B", 3], ["A", 4], ["B", 4], ["A", 5]
]
violin = [
    [1], [2], [2], [3], [3], [3], [4], [4], [5], [5], [5], [5], [6], [6], [7]
]
sunburst = [
    ["Eve", "", 10], ["Cain", "Eve", 14], ["Seth", "Eve", 12], ["Enos", "Seth", 10], ["Noam", "Seth", 2],
    ["Abel", "Eve", 6], ["Awan", "Eve", 6], ["Enoch", "Awan", 4], ["Azura", "Eve", 4]
]

header = [
    "scatter_x", "scatter_y", "bar_label", "bar_val", "pie_label", "pie_val",
    "city", "lat", "lon", "pop", "state_id", "state_name", "state_val",
    "strip_x", "strip_y", "violin_y", "generic_x", "generic_y_base",
    "sunburst_label", "sunburst_parent", "sunburst_val"
]

rows = []
max_len = max(len(scatter), len(bar), len(pie), len(map_data), len(usa), len(features), len(strip), len(violin), len(sunburst))

for i in range(max_len):
    row = []
    # scatter (0,1)
    if i < len(scatter): row.extend(scatter[i])
    else: row.extend(["", ""])
    # bar (2,3)
    if i < len(bar): row.extend(bar[i])
    else: row.extend(["", ""])
    # pie (4,5)
    if i < len(pie): row.extend(pie[i])
    else: row.extend(["", ""])
    # map (6,7,8,9)
    if i < len(map_data): row.extend(map_data[i])
    else: row.extend(["", "", "", ""])
    # usa (10,11,12)
    if i < len(usa): row.extend(usa[i])
    else: row.extend(["", "", ""])
    # strip (13,14)
    if i < len(strip): row.extend(strip[i])
    else: row.extend(["", ""])
    # violin (15)
    if i < len(violin): row.extend(violin[i])
    else: row.extend([""])
    # features (16,17)
    if i < len(features): row.extend(features[i])
    else: row.extend(["", ""])
    # sunburst (18,19,20)
    if i < len(sunburst): row.extend(sunburst[i])
    else: row.extend(["", "", ""])
    
    rows.append(row)

with open('public/exampleData.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(rows)

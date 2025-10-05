from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os, requests

# load environment variables, the API key for our project 
load_dotenv()

app = Flask(__name__)

def _aqi_label(idx: int) -> str:
    # OpenWeather AQI index: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    return {1:"Good", 2:"Fair", 3:"Moderate", 4:"Poor", 5:"Very Poor"}.get(idx, "Unknown")

def fetch_openweather_air(lat: float, lon: float):
    key = os.getenv("OPENWEATHER_API_KEY", "")
    if not key:
        return {"ok": False, "error": "Missing OPENWEATHER_API_KEY"}

    air_url = "https://api.openweathermap.org/data/2.5/air_pollution"
    wx_url  = "https://api.openweathermap.org/data/2.5/weather"

    try:
        air = requests.get(air_url, params={"lat": lat, "lon": lon, "appid": key}, timeout=10)
        air.raise_for_status()
        a = air.json()

        # ⚠️ guard: list may be empty
        lst = a.get("list") or []
        if not lst:
            return {"ok": False, "error": "OpenWeather air list empty"}

        item = lst[0]
        aqi_idx = (item.get("main") or {}).get("aqi")
        comps   = item.get("components") or {}

        wx = requests.get(wx_url, params={"lat": lat, "lon": lon, "appid": key, "units": "metric"}, timeout=10)
        wx.raise_for_status()
        w = wx.json()

        result = {
            "ok": True,
            "source": "openweather",
            "aqi": aqi_idx,
            "aqi_label": _aqi_label(aqi_idx),
            "components": {
                "pm2_5": comps.get("pm2_5"),
                "pm10":  comps.get("pm10"),
                "o3":    comps.get("o3"),
                "no2":   comps.get("no2"),
                "so2":   comps.get("so2"),
                "co":    comps.get("co"),
            },
            "weather": {
                "id":         w.get("id"),
                "name":       w.get("name"),
                "coord":      w.get("coord", {}),
                "country":    (w.get("sys") or {}).get("country"),
                "sunrise":    (w.get("sys") or {}).get("sunrise"),
                "sunset":     (w.get("sys") or {}).get("sunset"),
                "dt":         w.get("dt"),
                "timezone":   w.get("timezone"),
                "temp":       (w.get("main") or {}).get("temp"),
                "feels_like": (w.get("main") or {}).get("feels_like"),
                "temp_min":   (w.get("main") or {}).get("temp_min"),
                "temp_max":   (w.get("main") or {}).get("temp_max"),
                "humidity":   (w.get("main") or {}).get("humidity"),
                "pressure":   (w.get("main") or {}).get("pressure"),
                "visibility": w.get("visibility"),
                "wind": {
                    "speed_kmh": round(((w.get("wind") or {}).get("speed") or 0) * 3.6, 1),
                    "deg":       (w.get("wind") or {}).get("deg"),
                },
                "clouds":     (w.get("clouds") or {}).get("all"),
                "weather":    w.get("weather", []),
            },
            "sidebar": {
                "temp_c":   (w.get("main") or {}).get("temp"),
                "wind_kmh": round(((w.get("wind") or {}).get("speed") or 0) * 3.6, 1),
                "city":     w.get("name"),
            }
        }
        return result

    except requests.exceptions.RequestException as e:
        return {"ok": False, "error": str(e)}

# --- Fallback: Open-Meteo Air Quality (no API key) ---
def fetch_openmeteo_air(lat: float, lon: float):
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide"
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        d = r.json()
        times = d.get("hourly", {}).get("time", [])
        if not times:
            return {"ok": False, "error": "No hourly data"}
        i = len(times) - 1
        h = d["hourly"]
        us_aqi = h.get("us_aqi", [None])[i]
        # quick label from US AQI bucket
        label = "Unknown"
        if us_aqi is not None:
            label = ("Good" if us_aqi <= 50 else
                     "Fair" if us_aqi <= 100 else
                     "Moderate" if us_aqi <= 150 else
                     "Poor" if us_aqi <= 200 else
                     "Very Poor")

        return {
            "ok": True,
            "source": "open-meteo",
            "timestamp": times[i],
            "aqi": us_aqi,
            "aqi_label": label,
            "components": {
                "pm2_5": h.get("pm2_5", [None])[i],
                "pm10":  h.get("pm10",  [None])[i],
                "o3":    h.get("ozone", [None])[i],
                "no2":   h.get("nitrogen_dioxide", [None])[i],
                "so2":   h.get("sulphur_dioxide", [None])[i],
                "co":    h.get("carbon_monoxide", [None])[i],
            }
        }
    except requests.exceptions.RequestException as e:
        return {"ok": False, "error": str(e)}

# --- Unified endpoint: try OpenWeather, else fallback to Open-Meteo ---
@app.get("/api/air")
def api_air():
    try:
        lat = float(request.args.get("lat", "42.3149"))
        lon = float(request.args.get("lon", "-83.0364"))
    except ValueError:
        return jsonify(ok=False, error="Invalid lat/lon"), 400

    primary = fetch_openweather_air(lat, lon)
    if primary.get("ok"):
        return jsonify(primary), 200

    # ✅ try fallback
    fallback = fetch_openmeteo_air(lat, lon)
    return jsonify(fallback), (200 if fallback.get("ok") else 502)


# Home route
@app.route('/')
def home():
    return render_template('index.html')  # This will be your frontend page


# Health check route (test backend)
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify(status="ok", message="backend alive")


# API route (backend endpoint)
@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json  # Receive JSON data from frontend
    # Do backend stuff here (or call another Python backend service)
    result = {"message": f"Received {data}"}
    return jsonify(result)



if __name__ == '__main__':
    app.run(debug=True)
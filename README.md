# 🌎 CleanSkies

**CleanSkies** is a web application that visualizes live air quality and weather conditions anywhere on Earth.
Built during the NASA Space Apps Hackathon, it combines real-time environmental data with an interactive global map to raise awareness about air quality and climate health.

---

## ✨ Features

* **Interactive Leaflet map** — click anywhere to see local AQI and weather.
* **Live data integration** — fetches from OpenWeather (real sensor data) and Open-Meteo (modelled fallback).
* **Air Quality Index breakdown** — AQI level, health advice, PM2.5/PM10 pollutants, and weather details.
* **Responsive sidebar** — slide-in panel updates dynamically as you explore.
* **Extra info modal** — expandable center panel for future charts and analytics.
* **Smart defaults** — starts centered on Canada but supports global exploration.

---

## 🌐 Live Website
You can explore the live version of CleanSkies here:
https://cleanskies.wiki


---

## Example Screenshot
![CleanSkies Demo](CleanSky/static/assets/demo1.png)
![CleanSkies Demo](CleanSkystatic/assets/demo2.png)

---

## 🧰 Tech Stack

| Layer               | Tools / Libraries                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | HTML5, TailwindCSS, Leaflet.js                                                                                                                                                      |
| **Backend**         | Python (Flask), Requests, python-dotenv                                                                                                                                             |
| **Data APIs**       | [OpenWeather API](https://openweathermap.org/api), [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), [Nominatim (OpenStreetMap)](https://nominatim.org) |
| **Hosting (local)** | Flask dev server (127.0.0.1:5000)                                                                                                                                                   |
---

## 🧬 System Architecture

```
Frontend (Leaflet + JS)
       ↓   AJAX (fetch /api/air?lat=..&lon=..)
Backend (Flask)
       ├─> OpenWeather Air Pollution API  (primary)
       ├─> Open-Meteo Air Quality API     (fallback)
       └─> Nominatim Reverse-Geocode      (city names)
```

* The backend merges and normalizes the responses into a single, consistent JSON:

  ```json
  {
    "ok": true,
    "source": "openweather",
    "aqi": 2,
    "aqi_label": "Fair",
    "components": {"pm2_5": 8.3, "pm10": 14.5},
    "weather": {"city": "Toronto", "temp_c": 20.5, "wind_kmh": 12}
  }
  ```

---

## 💻 Run Locally (Developers / Contributors)
If you’d like to run the app locally:

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/CleanSkies.git
cd CleanSkies
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate      # (on macOS / Linux)
venv\Scripts\activate         # (on Windows)
```

### 3. Install dependencies
Install all required packages using the provided requirements file:

```bash
pip install -r requirements.txt
```

### 4. Add your `.env` file

Create a file named `.env` in the project root:

```
OPENWEATHER_API_KEY=your_openweather_key_here

```

### 5. Run the Flask server

```bash
python app.py
```

Then open the app at : **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🌐 APIs Used

| API                           | Purpose                                    | Auth      | Notes                                |
| ----------------------------- | ------------------------------------------ | --------- | ------------------------------------ |
| **OpenWeather Air Pollution** | Real measured AQI, PM2.5/PM10, and weather | ✅ API key | Primary data source                  |
| **Open-Meteo Air Quality**    | Global modelled AQI fallback               | ❌ none    | Covers areas without sensors         |
| **Nominatim (OpenStreetMap)** | Reverse-geocode city/town name             | ❌ none    | Used when API doesn’t provide a name |

---

## 🚀 Future Enhancements
Coming soon ... 

---

## 👩‍💻 Team

**The Muffin Man Team — NASA Space Apps Hackathon 2025**

| Member          |
| --------------- |
| Anant Kumar     |
| Marco Lee-Shi   |
| Hanan Senah     |
| Sharmarke Kedie |
| Lynn Hajj Hassan|

---

## 🪪 License

This project is open-sourced under the **MIT License** — feel free to use, modify, and learn from it.


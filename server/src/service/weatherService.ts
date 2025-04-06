// server/src/service/weatherService.ts
import dotenv from 'dotenv';
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}

class Weather {
  date: string;
  temperature: number;
  wind: number;
  humidity: number;
  description: string;
  icon: string;

  constructor(
    date: string,
    temperature: number,
    wind: number,
    humidity: number,
    description: string,
    icon: string
  ) {
    this.date = date;
    this.temperature = temperature;
    this.wind = wind;
    this.humidity = humidity;
    this.description = description;
    this.icon = icon;
  }
}

class WeatherService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.API_KEY || '';

    if (!this.apiKey) {
      throw new Error('Missing OpenWeather API key in environment variables.');
    }
  }

  private async fetchLocationData(query: string): Promise<Coordinates> {
    const geoUrl = this.buildGeocodeQuery(query);
    const res = await fetch(geoUrl);
    if (!res.ok) throw new Error('Failed to fetch location data');

    const data = await res.json();
    if (!data.length) throw new Error(`City "${query}" not found`);

    return { lat: data[0].lat, lon: data[0].lon };
  }

  private destructureLocationData(locationData: Coordinates): Coordinates {
    const { lat, lon } = locationData;
    return { lat, lon };
  }

  private buildGeocodeQuery(city: string): string {
    return `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      city
    )}&limit=1&appid=${this.apiKey}`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseUrl}/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=metric&appid=${this.apiKey}`;
  }

  private async fetchAndDestructureLocationData(city: string): Promise<Coordinates> {
    const rawCoords = await this.fetchLocationData(city);
    return this.destructureLocationData(rawCoords);
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<any> {
    const url = this.buildWeatherQuery(coordinates);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather data');
    return await res.json();
  }

  private parseCurrentWeather(response: any): Weather {
    const data = response.list[0];
    return new Weather(
      data.dt_txt,
      data.main.temp,
      data.wind.speed,
      data.main.humidity,
      data.weather[0].description,
      data.weather[0].icon
    );
  }

  private buildForecastArray(currentWeather: Weather, list: any[]): Weather[] {
    const forecast: Weather[] = [];
    const seenDays = new Set<string>();

    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];

      if (date !== currentWeather.date.split(' ')[0] && !seenDays.has(date)) {
        forecast.push(
          new Weather(
            item.dt_txt,
            item.main.temp,
            item.wind.speed,
            item.main.humidity,
            item.weather[0].description,
            item.weather[0].icon
          )
        );
        seenDays.add(date);
      }

      if (forecast.length === 5) break;
    }

    return forecast;
  }

  // ✅ Updated to match frontend expectations
  public async getWeatherForCity(city: string): Promise<any[]> {
    const coordinates = await this.fetchAndDestructureLocationData(city);
    const rawWeatherData = await this.fetchWeatherData(coordinates);
    const current = this.parseCurrentWeather(rawWeatherData);
    const forecast = this.buildForecastArray(current, rawWeatherData.list);

    return [
      {
        city,
        date: current.date.split(' ')[0],
        icon: current.icon,
        iconDescription: current.description,
        tempF: (current.temperature * 9) / 5 + 32,
        windSpeed: current.wind,
        humidity: current.humidity,
      },
      ...forecast.map((day) => ({
        date: day.date.split(' ')[0],
        icon: day.icon,
        iconDescription: day.description,
        tempF: (day.temperature * 9) / 5 + 32,
        windSpeed: day.wind,
        humidity: day.humidity,
      })),
    ];
  }
}

export default new WeatherService();

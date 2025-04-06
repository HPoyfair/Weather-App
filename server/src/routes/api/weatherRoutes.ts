// server/src/routes/api/weatherRoutes.ts

import { Router } from 'express';
import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

const router = Router();

// TODO: POST Request with city name to retrieve weather data
router.post('/', async (req, res) => {
  const { cityName } = req.body;

  if (!cityName) {
    res.status(400).json({ error: 'City name is required.' });
    return; // ✅ Fixes TS7030
  }

  try {
    const weatherData = await WeatherService.getWeatherForCity(cityName);
    await HistoryService.addCity(cityName);
    res.json(weatherData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve weather data.' });
  }
});

// TODO: GET search history
router.get('/history', async (_req, res) => {
  try {
    const cities = await HistoryService.getCities();
    return res.json(cities);
  } catch (error: any) {
    console.error('Error in GET /api/weather/history:', error);
    return res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// * BONUS TODO: DELETE city from search history
router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await HistoryService.removeCity(id);
    return res.status(204).end();
  } catch (error: any) {
    console.error('Error in DELETE /api/weather/history/:id:', error);
    return res.status(500).json({ error: 'Failed to delete city' });
  }
});

export default router;

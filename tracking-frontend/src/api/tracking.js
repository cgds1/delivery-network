import axios from 'axios';

export async function getTracking(code) {
  // In Docker: nginx proxies /api/tracking/ → central-server
  // In local dev: point to http://localhost:3000
  const baseUrl = process.env.REACT_APP_API_URL || '';
  const response = await axios.get(`${baseUrl}/api/tracking/${code.toUpperCase()}`);
  return response.data; // { shipment, history }
}

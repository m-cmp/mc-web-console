import axios from 'axios';

const url = 'http://localhost:3000';

const createInstance = (service: string) => {
  return axios.create({
    baseURL: `${url}/${service}`,
    withCredentials: true,
  });
};

export const axiosInstance = createInstance('test'); //http://localhost:3000/test
export const dashboardInstance = createInstance('dashboard'); // http://localhost:3000/dashboard

import axiosClient from './axiosClient';

const notificationApi = {
    getMyNotifications: () => axiosClient.get('/notifications'),
    markRead: (id) => axiosClient.put(`/notifications/${id}/read`),
    markAllRead: () => axiosClient.put('/notifications/read-all'),
    deleteAll: () => axiosClient.delete('/notifications'),
};

export default notificationApi;

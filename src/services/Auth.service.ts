import api from './Api.service';

export const authService = {
    login: async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const response = await api.post('/accounts/api/login/', { email, password });

            if (response.data.access) {
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('access_token', response.data.access);
                storage.setItem('refresh_token', response.data.refresh);

                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
    },


    register: async (userData: any) => {
        try {
            const response = await api.post('/accounts/api/registro/', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyRegistration: async (email: string, codigo: string) => {
        try {
            const response = await api.post('/accounts/api/registro/verificar/', { email, codigo });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    resendVerificationCode: async (email: string) => {
        try {
            const response = await api.post('/accounts/api/registro/verificar/', { email, reenviar: true });
            return response.data;
        } catch (error) {
            throw error;
        }
    },


    requestPasswordReset: async (email: string) => {
        try {
            const response = await api.post('/accounts/api/recuperacion/solicitar/', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyResetCode: async (email: string, codigo: string) => {
        try {
            const response = await api.post('/accounts/api/recuperacion/verificar/', { email, codigo });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (data: any) => {
        try {
            const response = await api.post('/accounts/api/recuperacion/restablecer/', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getUserProfile: async () => {
        try {
            const response = await api.get('/accounts/api/perfil/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

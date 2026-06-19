// src/services/authService.ts
import api from './Api.service';

export const authService = {
    // Función para iniciar sesión
    // Función para iniciar sesión
    login: async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            // Hacemos el POST al endpoint
            const response = await api.post('/accounts/api/login/', { email, password });

            // Si fue exitoso, guardamos los tokens en el almacenamiento correspondiente
            if (response.data.access) {
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('access_token', response.data.access);
                storage.setItem('refresh_token', response.data.refresh);

                // Recordar el email del usuario en el formulario si marcó Recordarme
                if (rememberMe) {
                    localStorage.setItem('remembered_email', email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
            }
            return response.data;
        } catch (error) {
            // Si hay error (401, 403, 404), lo lanzamos para manejarlo en el componente
            throw error;
        }
    },

    // Función para cerrar sesión (borra los tokens de ambos almacenamientos)
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
    },

    // --- Funciones para registro y verificación de cuenta ---

    // 1. Enviar datos de registro
    register: async (userData: any) => {
        try {
            const response = await api.post('/accounts/api/registro/', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 2. Enviar código de verificación
    verifyRegistration: async (email: string, codigo: string) => {
        try {
            const response = await api.post('/accounts/api/registro/verificar/', { email, codigo });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3. Solicitar reenvío de código
    resendVerificationCode: async (email: string) => {
        try {
            // Usamos el mismo endpoint pero con la bandera 'reenviar: true'
            const response = await api.post('/accounts/api/registro/verificar/', { email, reenviar: true });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // --- FLUJO DE RECUPERACIÓN DE CONTRASEÑA ---

    // Paso 1: Solicitar código
    requestPasswordReset: async (email: string) => {
        try {
            const response = await api.post('/accounts/api/recuperacion/solicitar/', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Paso 2: Verificar que el código ingresado es válido
    verifyResetCode: async (email: string, codigo: string) => {
        try {
            const response = await api.post('/accounts/api/recuperacion/verificar/', { email, codigo });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Paso 3: Enviar la nueva contraseña
    resetPassword: async (data: any) => {
        try {
            // data debe contener: email, codigo, password, password2
            const response = await api.post('/accounts/api/recuperacion/restablecer/', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // NUEVO: Obtener los datos del usuario logueado
    getUserProfile: async () => {
        try {
            // Usar 'api' para que el interceptor inyecte el JWT automáticamente
            const response = await api.get('/accounts/api/perfil/');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};
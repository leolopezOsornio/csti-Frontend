import Swal from 'sweetalert2';
import type { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

const sharedClasses = {
  popup: 'app-alert-popup',
  title: 'app-alert-title',
  htmlContainer: 'app-alert-text',
  actions: 'app-alert-actions',
  confirmButton: 'app-alert-confirm',
  cancelButton: 'app-alert-cancel',
  timerProgressBar: 'app-alert-progress',
};

const toastClasses = {
  popup: 'app-toast-popup',
  title: 'app-toast-title',
  htmlContainer: 'app-toast-text',
  timerProgressBar: 'app-alert-progress',
};

export const appAlert = (options: SweetAlertOptions) =>
  Swal.fire({
    buttonsStyling: false,
    confirmButtonText: 'Aceptar',
    customClass: sharedClasses,
    showClass: {
      popup: 'swal2-show app-alert-enter',
    },
    hideClass: {
      popup: 'swal2-hide app-alert-exit',
    },
    ...options,
  });

export const appToast = (
  icon: SweetAlertIcon,
  title: string,
  text?: string,
  timer = 2400
) =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: toastClasses,
  });

export const appLoadingToast = (title: string, text?: string) =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    title,
    text,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    customClass: toastClasses,
    didOpen: () => {
      Swal.showLoading();
    },
  });

export const closeAppAlert = () => {
  Swal.close();
};

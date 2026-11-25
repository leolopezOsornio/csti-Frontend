import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Swal from 'sweetalert2';
import type { SweetAlertOptions } from 'sweetalert2';

// SweetAlert receives an element, never an HTML string containing user data.
export function showReactAlert(content: ReactNode, options: Pick<SweetAlertOptions,
  'title' | 'icon' | 'width' | 'confirmButtonText' | 'confirmButtonColor' | 'customClass'>) {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => root.render(content));
  return Swal.fire({ ...options, html: container, didDestroy: () => root.unmount() });
}

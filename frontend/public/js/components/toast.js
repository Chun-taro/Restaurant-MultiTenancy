/**
 * Toast Notification Manager
 */

const Toast = {
  show(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: 'ri-checkbox-circle-fill',
      error: 'ri-error-warning-fill',
      info: 'ri-information-fill'
    };

    toast.innerHTML = `
      <i class="${iconMap[type] || 'ri-information-fill'}" style="font-size: 20px;"></i>
      <div class="toast-msg">${message}</div>
      <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px;">
        <i class="ri-close-line"></i>
      </button>
    `;

    toast.querySelector('button').onclick = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    };

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }
};

window.Toast = Toast;
